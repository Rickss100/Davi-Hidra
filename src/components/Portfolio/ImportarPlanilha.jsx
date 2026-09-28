import { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import * as XLSX from 'xlsx';

const ImportarPlanilha = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const { fetchObjectives } = usePortfolio(); // or any generic refresh function we have

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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        parseB3Data(json);
      } catch (err) {
        console.error(err);
        setError('Erro ao ler a planilha. Verifique se o formato está correto.');
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const parseB3Data = (rows) => {
    if (!rows || rows.length === 0) {
      setError('A planilha está vazia.');
      return;
    }

    const parsedTransactions = [];
    let count = 0;

    rows.forEach(row => {
      // B3 Columns mapping (approximate based on B3 pattern)
      // Usually "Data", "Movimentação", "Produto", "Instituição", "Quantidade", "Preço unitário", "Valor da Operação"
      
      const mov = row['Movimentação'] || row['Movimentacao'] || row['Tipo'] || '';
      const dataStr = row['Data'] || row['Data do Negócio'] || '';
      const produto = row['Produto'] || row['Código'] || row['Ativo'] || '';
      const qty = row['Quantidade'] || 0;
      const preco = row['Preço unitário'] || row['Preço'] || 0;

      // Filter only Buys and Sells (Ignore Transferências, Desdobramentos for now unless specified)
      const movUpper = mov.toString().toUpperCase();
      if (!movUpper.includes('COMPRA') && !movUpper.includes('VENDA') && !movUpper.includes('TRANSFERÊNCIA')) return;

      const isBuy = movUpper.includes('COMPRA') || movUpper.includes('TRANSFERÊNCIA');
      const type = isBuy ? 'buy' : 'sell';

      // Extract asset code (B3 usually sends "PETROBRAS PN N2 - PETR4", we need "PETR4")
      let assetCode = produto.toString().split(' - ').pop().trim();
      if (assetCode.includes(' ')) {
        assetCode = assetCode.split(' ')[0]; // fallback
      }
      
      // Date conversion from DD/MM/YYYY to YYYY-MM-DD
      let isoDate = new Date().toISOString().split('T')[0];
      if (dataStr) {
        const parts = dataStr.toString().split('/');
        if (parts.length === 3) {
          isoDate = \`\${parts[2]}-\${parts[1]}-\${parts[0]}\`;
        }
      }

      const quantity = Math.abs(parseFloat(qty));
      let priceStr = preco.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      const price = Math.abs(parseFloat(priceStr)) || 0;

      if (assetCode && quantity > 0) {
        parsedTransactions.push({
          asset_code: assetCode,
          type: type,
          quantity: quantity,
          price: price,
          total_value: quantity * price,
          date: isoDate,
          notes: \`Importado B3: \${mov}\`
        });
        count++;
      }
    });

    if (parsedTransactions.length === 0) {
      setError('Nenhuma transação de Compra ou Venda válida foi encontrada na planilha.');
      return;
    }

    setPreviewData(parsedTransactions);
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const response = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: previewData })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (onImportSuccess) onImportSuccess(result.count);
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
        Baixe sua planilha de movimentações na Área do Investidor da B3 e faça o upload aqui. O sistema lerá as colunas automaticamente.
      </p>

      {!previewData ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{ 
            border: '2px dashed #27272a', 
            borderRadius: '8px', 
            padding: '40px 20px', 
            textAlign: 'center',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.02)'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Arraste o arquivo .xlsx ou .csv aqui</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>ou clique para procurar no computador</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            style={{ display: 'none' }} 
          />
        </div>
      ) : (
        <div className="preview-container">
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '16px' }}>
            <p style={{ margin: 0, color: '#34d399', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} />
              Planilha lida com sucesso!
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#e2e8f0' }}>
              Encontramos <strong>{previewData.length}</strong> transações (compras/vendas) prontas para serem importadas.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setPreviewData(null)} 
              style={{ flex: 1, padding: '10px', background: '#27272a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              disabled={isProcessing}
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirmImport} 
              style={{ flex: 2, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Importando...' : 'Confirmar Importação'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
};

export default ImportarPlanilha;
