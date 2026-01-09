import { useState, useMemo } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { getAssetsByCategory } from '../../data/assets';
import './Portfolio.css';

const TransactionForm = () => {
  const { addTransaction } = usePortfolio();
  const [activeTab, setActiveTab] = useState('buy'); // buy, sell, event

  const [formData, setFormData] = useState({
    code: '',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    category: 'acoes' // Default category
  });

  // Filter available assets based on selected category
  const availableAssets = useMemo(() => {
    return getAssetsByCategory(formData.category);
  }, [formData.category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.quantity || !formData.price) return;

    const priceNum = Number(formData.price.replace(',', '.'));
    const qtyNum = Number(formData.quantity);
    const totalValue = qtyNum * priceNum;
    
    addTransaction({
      ...formData,
      type: activeTab,
      quantity: qtyNum,
      price: priceNum,
      totalValue,
      id: Date.now()
    });

    // Reset form but keep category/date
    setFormData(prev => ({ ...prev, code: '', quantity: '', price: '' }));
    alert('Transação registrada com sucesso!');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ... (JSX start) ...

  return (
    <div className="transaction-container">
      <div className="transaction-tabs">
        <button 
          className={`tab-btn buy ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
        >
          Aporte
        </button>
        <button 
          className={`tab-btn sell ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          Venda
        </button>
        <button 
          className={`tab-btn event ${activeTab === 'event' ? 'active' : ''}`}
          onClick={() => setActiveTab('event')}
        >
          Registrar Evento
        </button>
      </div>

      <form onSubmit={handleSubmit} className={`transaction-form ${activeTab}`}>
        <div className="form-group">
          <label>Categoria</label>
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="acoes">Ações</option>
            <option value="fiis">FIIs</option>
            <option value="stocks">Stocks</option>
            <option value="reits">REITs</option>
          </select>
        </div>

        <div className="form-group">
          <label>Ativo (Código)</label>
          <input 
            type="text" 
            name="code" 
            placeholder="Ex: WEGE3" 
            value={formData.code} 
            onChange={handleChange} 
            className="uppercase-input"
            list="assets-list" 
            autoComplete="off"
          />
          <datalist id="assets-list">
             {availableAssets.map(asset => (
                 <option key={asset.ticker} value={asset.ticker} />
             ))}
          </datalist>
        </div>

        <div className="form-group">
          <label>Quantidade</label>
          <input 
            type="number" 
            name="quantity" 
            value={formData.quantity} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Preço Unitário</label>
          <input 
            type="number" step="0.01"
            name="price" 
            placeholder="0.00" 
            value={formData.price} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Data</label>
          <input 
            type="date" 
            name="date" 
            value={formData.date} 
            onChange={handleChange} 
          />
        </div>

        <button type="submit" className="submit-btn" disabled={!formData.code}>
          {activeTab === 'buy' ? 'CONFIRMAR APORTE' : activeTab === 'sell' ? 'CONFIRMAR VENDA' : 'REGISTRAR'}
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
