import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import readXlsxFile from 'read-excel-file/browser';

const ImportarPlanilha = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (selectedFile) => {
    setError('');
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.csv')) {
      setError('Por favor, envie um arquivo Excel (.xlsx) ou CSV.');
      return;
    }
    setFile(selectedFile);
    
    if (selectedFile.name.endsWith('.csv')) {
         setError('Formato CSV temporariamente não suportado nesta versão. Envie um arquivo Excel (.xlsx).');
         return;
      }
      
      readXlsxFile(selectedFile).then((result) => {
        let rows = result;
        // B3 often exports single sheets wrapped in an object or multiple sheets
        if (result.length > 0 && !Array.isArray(result[0]) && result[0].data) {
           rows = result[0].data;
        } else if (result.length === 1 && result[0].data) {
           rows = result[0].data;
        }
        
        if (!rows || rows.length < 2) {
           setError('A planilha não contém dados suficientes.');
           return;
        }
        const headers = rows[0];
        const json = [];
        for (let i = 1; i < rows.length; i++) {
            let obj = {};
            rows[i].forEach((cell, idx) => {
                 obj[headers[idx]] = cell;
            });
            json.push(obj);
        }
        parseB3Data(json);
      }).catch(err => {
        console.error(err);
        setError('Erro ao ler a planilha. Verifique se o formato está correto.');
      });
  };

  const parseMoney = (val) => {
    if (typeof val === 'number') return Math.abs(val);
    if (!val) return 0;
    let s = val.toString().replace('R$', '').replace('US$', '').trim();
    if (s.includes('.') && s.includes(',')) {
      const lastDot = s.lastIndexOf('.');
      const lastComma = s.lastIndexOf(',');
      if (lastComma > lastDot) {
        s = s.replace(/\\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    return Math.abs(parseFloat(s)) || 0;
  };

  const parseB3Data = (rows) => {
    if (!rows || rows.length === 0) {
      setError('A planilha está vazia.');
      return;
    }

    const parsedTransactions = [];
    let count = 0;

    rows.forEach(row => {
      const mov = row['Movimentação'] || row['Movimentacao'] || row['Tipo'] || '';
      const dataStr = row['Data'] || row['Data do Negócio'] || '';
      const produto = row['Produto'] || row['Código'] || row['Ativo'] || '';
      const qty = row['Quantidade'] || 0;
      const preco = row['Preço unitário'] || row['Preço'] || 0;
      const es = (row['Entrada/Saída'] || row['Entrada/Saida'] || '').toString().toUpperCase();

      const movUpper = mov.toString().toUpperCase();
      
      // Ignorar juros sobre capital, dividendos, rendimentos
      if (movUpper.includes('JUROS') || movUpper.includes('DIVIDENDO') || movUpper.includes('RENDIMENTO') || movUpper.includes('AMORTIZAÇÃO')) return;

      // Determinar o Tipo
      let type = 'buy';
      if (es === 'DEBITO' || es === 'DÉBITO') {
        type = 'sell';
      } else if (es === 'CREDITO' || es === 'CRÉDITO') {
        type = 'buy';
      } else {
        if (movUpper.includes('VENDA') || movUpper.includes('RESGATE')) type = 'sell';
        if (movUpper.includes('COMPRA') || movUpper.includes('APLICAÇÃO')) type = 'buy';
      }

      // Extrair o Código do Ativo
      let assetCode = produto.toString().trim();
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
      const valOp = row['Valor da Operação'] || row['Valor'] || 0;
      let totalVal = parseMoney(valOp);

      if (price === 0 && quantity > 0 && totalVal > 0) {
        price = totalVal / quantity;
      }

      if (assetCode && quantity > 0) {
        parsedTransactions.push({
          asset_code: assetCode,
          type: type,
          quantity: quantity,
          price: price,
          total_value: quantity * price,
          date: isoDate,
          notes: `Importado B3: ${mov}`
        });
        count++;
      }
    });

    if (parsedTransactions.length === 0) {
      setError('Nenhuma transação de Compra ou Venda válida encontrada.');
      return;
    }

    setPreviewData(parsedTransactions);
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const result = await api.post('/transactions/bulk', { transactions: previewData });
        const response = { ok: true }; // stub for the next line
      
      if (response.ok) {
        if (onImportSuccess) onImportSuccess(result.count || previewData.length);
        setFile(null);
        setPreviewData(null);
      } else {
        setError(result.error || 'Falha ao importar transações.');
      }
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
        Importar Histórico da B3
      </h3>
      <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
        Baixe sua planilha da B3 e faça o upload aqui. O sistema lerá as colunas automaticamente.
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
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Arraste o arquivo .xlsx ou .csv aqui</p>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv, .xlsx" style={{ display: 'none' }} />
        </div>
      ) : (
        <div className="preview-container">
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px' }}>
            <p style={{ margin: 0, color: '#34d399', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} /> Planilha lida com sucesso!
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e2e8f0' }}>
              Encontramos <strong>{previewData.length}</strong> transações prontas para importação.
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
