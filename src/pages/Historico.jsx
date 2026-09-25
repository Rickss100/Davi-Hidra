import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  Wallet, 
  BarChart3, 
  DollarSign, 
  Layers,
  ShieldAlert
} from 'lucide-react';
import './Historico.css';

const Historico = () => {
  const { transactions, removeTransaction } = usePortfolio();
  const { user } = useAuth();
  const isSuspended = user?.role === 'user' && (user?.status === 'suspended' || user?.isSuspended);
  const { success, error } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');

  // Cálculos consolidados no topo
  const metrics = useMemo(() => {
    let totalInvested = 0;
    let totalSells = 0;
    const uniqueAssets = new Set();

    transactions.forEach(t => {
      const val = Number(t.total_value || (t.quantity * t.price) || 0);
      if (t.type === 'buy') {
        totalInvested += val;
      } else {
        totalSells += val;
      }
      if (t.asset_code) uniqueAssets.add(t.asset_code);
    });

    const buyCount = transactions.filter(t => t.type === 'buy').length;
    const avgAporte = buyCount > 0 ? (totalInvested / buyCount) : 0;

    return {
      totalInvested,
      totalSells,
      totalCount: transactions.length,
      uniqueAssetsCount: uniqueAssets.size,
      avgAporte
    };
  }, [transactions]);

  // Transações filtradas e ordenadas
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Busca por código do ativo ou notas
      const matchSearch = searchTerm.trim() === '' || 
        (t.asset_code && t.asset_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro de categoria
      let matchCat = true;
      if (filterCategory !== 'ALL') {
        const cat = (t.category || '').toLowerCase();
        if (filterCategory === 'Acao') matchCat = cat.includes('acao');
        else if (filterCategory === 'FII') matchCat = cat.includes('fii');
        else if (filterCategory === 'Stock') matchCat = cat.includes('stock');
        else if (filterCategory === 'REIT') matchCat = cat.includes('reit');
        else if (filterCategory === 'RendaFixa') matchCat = cat.includes('renda') || cat.includes('fix');
      }

      // Filtro de tipo
      let matchType = true;
      if (filterType !== 'ALL') {
        matchType = t.type === filterType;
      }

      return matchSearch && matchCat && matchType;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'value-desc') {
        const vA = Number(a.total_value || (a.quantity * a.price) || 0);
        const vB = Number(b.total_value || (b.quantity * b.price) || 0);
        return vB - vA;
      }
      if (sortBy === 'value-asc') {
        const vA = Number(a.total_value || (a.quantity * a.price) || 0);
        const vB = Number(b.total_value || (b.quantity * b.price) || 0);
        return vA - vB;
      }
      return 0;
    });
  }, [transactions, searchTerm, filterCategory, filterType, sortBy]);

  const handleDelete = async (id, assetCode) => {
    if (isSuspended) {
      error('Sua conta está com status Suspenso. A exclusão de transações está bloqueada.');
      return;
    }

    if (!window.confirm(`Deseja realmente excluir a transação de ${assetCode}?`)) {
      return;
    }
    try {
      await removeTransaction(id);
      success(`Transação de ${assetCode} excluída com sucesso.`);
    } catch (err) {
      error('Erro ao excluir transação: ' + err.message);
    }
  };

  return (
    <div className="historico-container">
      {/* Header */}
      <div className="historico-header">
        <div className="historico-title-area">
          <h1>
            <History size={26} color="#04d361" />
            Histórico de Aportes & Transações
          </h1>
        </div>
        <p className="historico-subtitle">
          Consulte todos os seus registros de compras, vendas e movimentações patrimoniais.
        </p>
      </div>

      {/* Métricas Rápidas */}
      <div className="historico-metrics-grid">
        <div className="historico-metric-card">
          <div className="historico-metric-label">
            <span>Total em Aportes</span>
            <DollarSign size={16} color="#04d361" />
          </div>
          <div className="historico-metric-val" style={{ color: '#04d361' }}>
            R$ {metrics.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="historico-metric-sub">Capital total alocado em compras</div>
        </div>

        <div className="historico-metric-card">
          <div className="historico-metric-label">
            <span>Operações Registradas</span>
            <BarChart3 size={16} color="#38bdf8" />
          </div>
          <div className="historico-metric-val">
            {metrics.totalCount}
          </div>
          <div className="historico-metric-sub">Total de transações executadas</div>
        </div>

        <div className="historico-metric-card">
          <div className="historico-metric-label">
            <span>Ativos Distintos</span>
            <Layers size={16} color="#a855f7" />
          </div>
          <div className="historico-metric-val">
            {metrics.uniqueAssetsCount}
          </div>
          <div className="historico-metric-sub">Ativos com movimentação</div>
        </div>

        <div className="historico-metric-card">
          <div className="historico-metric-label">
            <span>Média por Aporte</span>
            <Wallet size={16} color="#f59e0b" />
          </div>
          <div className="historico-metric-val">
            R$ {metrics.avgAporte.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="historico-metric-sub">Média dos aportes de compra</div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="historico-filters-bar">
        <div className="search-box-wrapper">
          <Search size={16} className="search-box-icon" />
          <input
            type="text"
            placeholder="Buscar por código ou anotação (ex: PETR4, Tesouro)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-selects-group">
          <select 
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">Todas as Classes</option>
            <option value="Acao">Ações BR</option>
            <option value="FII">Fundos Imobiliários</option>
            <option value="Stock">Stocks (EUA)</option>
            <option value="REIT">REITs (EUA)</option>
            <option value="RendaFixa">Renda Fixa</option>
          </select>

          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="buy">Aportes / Compras</option>
            <option value="sell">Resgates / Vendas</option>
          </select>

          <select 
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Mais recentes primeiro</option>
            <option value="date-asc">Mais antigas primeiro</option>
            <option value="value-desc">Maior valor primeiro</option>
            <option value="value-asc">Menor valor primeiro</option>
          </select>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="historico-table-wrapper">
        {filteredTransactions.length === 0 ? (
          <div className="historico-empty-state">
            <div className="historico-empty-icon">
              <Wallet size={28} />
            </div>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>
              Nenhum aporte ou transação encontrada
            </h3>
            <p style={{ margin: 0, fontSize: '13px', maxWidth: '400px' }}>
              {transactions.length === 0 
                ? 'Você ainda não registrou nenhum aporte. Vá até a aba Carteira e clique em "Adicionar Transação" para começar.'
                : 'Nenhum registro corresponde aos filtros selecionados acima.'}
            </p>
            {transactions.length === 0 && (
              <Link to="/carteira" className="btn-go-carteira">
                <Wallet size={16} /> Ir para Carteira e Aportar
              </Link>
            )}
          </div>
        ) : (
          <table className="historico-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Ativo</th>
                <th>Quantidade</th>
                <th>Preço Unitário</th>
                <th>Total da Operação</th>
                <th>Observações</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const isBuy = tx.type === 'buy';
                const totalVal = Number(tx.total_value || (tx.quantity * tx.price) || 0);
                const isUS = tx.category === 'Stock' || tx.category === 'REIT' || (tx.asset_code && !tx.asset_code.match(/\d/));
                const currencyPrefix = isUS ? 'US$ ' : 'R$ ';

                return (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 600, color: '#cbd5e1' }}>
                      {tx.date ? new Date(tx.date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <span className={`badge-type ${isBuy ? 'buy' : 'sell'}`}>
                        {isBuy ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                        {isBuy ? 'Compra / Aporte' : 'Venda / Resgate'}
                      </span>
                    </td>
                    <td>
                      <div className="asset-code-cell">
                        <span>{tx.asset_code}</span>
                        {tx.category && (
                          <span className="badge-category">{tx.category}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {Number(tx.quantity).toLocaleString('pt-BR')}
                    </td>
                    <td>
                      {currencyPrefix}{Number(tx.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: 700, color: isBuy ? '#34d399' : '#f87171' }}>
                      {isBuy ? '+' : '-'} {currencyPrefix}{totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                      {tx.notes || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(tx.id, tx.asset_code)}
                        disabled={isSuspended}
                        title={isSuspended ? 'Exclusão bloqueada para contas suspensas' : 'Excluir este aporte'}
                        style={isSuspended ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Historico;
