import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import readXlsxFile from 'read-excel-file/browser';
import { api } from '../../services/api';

const ImportarPlanilha = ({ onImportSuccess }) => {
  const [filesCount, setFilesCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewStats, setPreviewStats] = useState({ trades: 0, events: 0 });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) processFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) processFiles(selectedFiles);
  };

  const parseMoney = (val) => {
    if (typeof val === 'number') return Math.abs(val);
    if (!val) return 0;
    let s = val.toString().replace('R$', '').replace('US$', '').trim();
    if (s === '-' || s === '') return 0;
    if (s.includes('.') && s.includes(',')) {
      const lastDot = s.lastIndexOf('.');
      const lastComma = s.lastIndexOf(',');
      if (lastComma > lastDot) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    return Math.abs(parseFloat(s)) || 0;
  };

  const extractJsonFromSheet = (rows) => {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0];
    const json = [];
    for (let i = 1; i < rows.length; i++) {
      let obj = {};
      rows[i].forEach((cell, idx) => {
        if (headers[idx]) obj[headers[idx]] = cell;
      });
      json.push(obj);
    }
    return json;
  };

  const processFiles = async (fileList) => {
    setError('');
    const validFiles = fileList.filter(f => f.name.endsWith('.xlsx'));
    if (validFiles.length === 0) {
      setError('Por favor, envie um ou mais arquivos Excel (.xlsx) exportados da B3.');
      return;
    }

    setFilesCount(validFiles.length);
    const allJsonRows = [];

    try {
      for (const selectedFile of validFiles) {
        const result = await readXlsxFile(selectedFile);
        if (Array.isArray(result) && result.length > 0 && !Array.isArray(result[0]) && result[0].data) {
          // Multi-sheet or wrapped B3 export
          for (const sheetObj of result) {
            const sheetName = String(sheetObj.sheet || '').toLowerCase();
            if (sheetName.includes('proventos')) continue; // Evitar duplicar resumo anual de proventos sem data
            const extracted = extractJsonFromSheet(sheetObj.data);
            allJsonRows.push(...extracted);
          }
        } else if (Array.isArray(result)) {
          const extracted = extractJsonFromSheet(result);
          allJsonRows.push(...extracted);
        }
      }
      parseB3Data(allJsonRows);
    } catch (err) {
      console.error(err);
      setError('Erro ao ler a(s) planilha(s). Verifique se o formato B3 (.xlsx) está correto.');
    }
  };

  const parseB3Data = (rows) => {
    if (!rows || rows.length === 0) {
      setError('A planilha está vazia.');
      return;
    }

    const parsedTransactions = [];
    const seenKeys = new Set();
    let tradeCount = 0;
    let eventCount = 0;

    rows.forEach(row => {
      const mov = row['Movimentação'] || row['Movimentacao'] || row['Tipo'] || '';
      const dataStr = row['Data'] || row['Data do Negócio'] || '';
      const produto = row['Produto'] || row['Código de Negociação'] || row['Código'] || row['Ativo'] || '';
      const qty = row['Quantidade'] || row['Quantidade Disponível'] || 0;
      const preco = row['Preço unitário'] || row['Preço de Fechamento'] || row['Preço'] || 0;
      const valOp = row['Valor da Operação'] || row['Valor Atualizado'] || row['Valor'] || 0;
      const es = (row['Entrada/Saída'] || row['Entrada/Saida'] || '').toString().toUpperCase();

      const movUpper = mov.toString().toUpperCase();

      // Ignorar eventos puramente cadastrais ou direitos não exercidos
      if (
        movUpper.includes('ATUALIZAÇÃO') ||
        movUpper.includes('ATUALIZACAO') ||
        movUpper.includes('SUBSCRIÇÃO') ||
        movUpper.includes('SUBSCRICAO') ||
        movUpper.includes('AMORTIZAÇÃO')
      ) {
        return;
      }

      // Extrair o Código do Ativo
      let assetCode = (row['Código de Negociação'] || produto).toString().trim();
      if (assetCode.includes(' - ')) {
        const parts = assetCode.split(' - ').map(p => p.trim());
        const firstPart = parts[0].toUpperCase();
        if (firstPart === 'CDB' || firstPart === 'RDB' || firstPart === 'LC' || firstPart === 'LCI' || firstPart === 'LCA') {
          assetCode = parts.length > 1 ? parts[1] : parts[0];
        } else {
          assetCode = parts[0];
        }
      }
      if (assetCode.includes(' ') && assetCode.length > 15) {
        assetCode = assetCode.split(' ')[0];
      }
      if (!assetCode || assetCode.toLowerCase() === 'total') return;

      // Converter Data
      let isoDate = new Date().toISOString().split('T')[0];
      if (dataStr) {
        const parts = dataStr.toString().split('/');
        if (parts.length === 3) {
          isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      let quantity = parseMoney(qty);
      let price = parseMoney(preco);
      let totalVal = parseMoney(valOp);

      // 1. Verificar se é Provento / Renda Passiva (Dividendo, JCP, Rendimento, Leilão de Fração)
      const isDividendEvent =
        movUpper.includes('JUROS') ||
        movUpper.includes('DIVIDENDO') ||
        movUpper.includes('RENDIMENTO') ||
        movUpper.includes('LEILÃO') ||
        movUpper.includes('LEILAO');

      if (isDividendEvent) {
        if (totalVal <= 0 && quantity > 0 && price > 0) {
          totalVal = Number((quantity * price).toFixed(2));
        }
        if (assetCode && totalVal > 0) {
          const dedupKey = `event|${assetCode}|${isoDate}|${totalVal}|${mov}`;
          if (!seenKeys.has(dedupKey)) {
            seenKeys.add(dedupKey);
            parsedTransactions.push({
              asset_code: assetCode,
              type: 'event',
              quantity: quantity || 1,
              price: price || totalVal,
              total_value: totalVal,
              date: isoDate,
              notes: `Provento B3: ${mov}`
            });
            eventCount++;
          }
        }
        return;
      }

      // 2. Determinar o Tipo de Operação de Custódia (Compra / Venda / Bonificação / Fração)
      let type = 'buy';
      if (es === 'DEBITO' || es === 'DÉBITO') {
        type = 'sell';
      } else if (es === 'CREDITO' || es === 'CRÉDITO') {
        type = 'buy';
      } else {
        if (movUpper.includes('VENDA') || movUpper.includes('RESGATE')) type = 'sell';
        if (movUpper.includes('COMPRA') || movUpper.includes('APLICAÇÃO')) type = 'buy';
      }

      if (price === 0 && quantity > 0 && totalVal > 0) {
        price = totalVal / quantity;
      }

      if (assetCode && quantity > 0) {
        const computedTotal = Number((quantity * price).toFixed(2));
        const dedupKey = `${type}|${assetCode}|${isoDate}|${quantity}|${price}`;
        if (!seenKeys.has(dedupKey)) {
          seenKeys.add(dedupKey);
          parsedTransactions.push({
            asset_code: assetCode,
            type: type,
            quantity: quantity,
            price: price,
            total_value: computedTotal,
            date: isoDate,
            notes: `Importado B3: ${mov || 'Posição Consolidada'}`
          });
          tradeCount++;
        }
      }
    });

    if (parsedTransactions.length === 0) {
      setError('Nenhuma transação ou provento válido encontrado na(s) planilha(s).');
      return;
    }

    setPreviewStats({ trades: tradeCount, events: eventCount });
    setPreviewData(parsedTransactions);
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const result = await api.post('/transactions/bulk', { transactions: previewData });
      if (onImportSuccess) onImportSuccess(result.count || previewData.length);
      setFilesCount(0);
      setPreviewData(null);
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="import-container" style={{ padding: '20px', background: '#121214', borderRadius: '12px', border: '1px solid #27272a' }}>
      <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileSpreadsheet size={20} color="#10b981" /> 
        Importar Histórico & Proventos da B3
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
        Arraste uma ou várias planilhas (.xlsx) da B3 de uma só vez. O sistema importa compras, vendas, bonificações e dividendos automaticamente.
      </p>

      {!previewData ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{ 
            border: '2px dashed #27272a', borderRadius: '8px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Arraste um ou mais arquivos .xlsx da B3 aqui</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Suporta múltiplos anos simultâneos (Movimentação e Posição Consolidada)</p>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx" style={{ display: 'none' }} />
        </div>
      ) : (
        <div className="preview-container">
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px' }}>
            <p style={{ margin: 0, color: '#34d399', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} /> {filesCount > 1 ? `${filesCount} planilhas lidas com sucesso!` : 'Planilha lida com sucesso!'}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e2e8f0' }}>
              Encontramos <strong>{previewStats.trades}</strong> operações de custódia e <strong>{previewStats.events}</strong> proventos/dividendos prontos para importação.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setPreviewData(null)} style={{ flex: 1, padding: '10px', background: '#27272a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }} disabled={isProcessing}>
              Cancelar
            </button>
            <button onClick={handleConfirmImport} style={{ flex: 2, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} disabled={isProcessing}>
              {isProcessing ? 'Importando...' : 'Confirmar Importação'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
    </div>
  );
};

export default ImportarPlanilha;
