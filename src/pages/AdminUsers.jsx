import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  Shield, 
  Key, 
  UserPlus, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Search, 
  RefreshCw, 
  FolderSearch, 
  Trash2, 
  Edit3,
  TrendingUp,
  Clock,
  Cloud,
  Database
} from 'lucide-react';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modais
  const [editingUser, setEditingUser] = useState(null); // { id, name, email, password, role, status }
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inspectingUser, setInspectingUser] = useState(null); // dados do portfolio do usuário
  const [inspectLoading, setInspectLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', status: 'active' });
  const [showPasswords, setShowPasswords] = useState({});
  const [tursoStatus, setTursoStatus] = useState(null);

  const { success, error: showError } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      showError('Falha ao carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  const checkTursoStatus = async () => {
    try {
      const res = await fetch('/api/admin/turso-status');
      if (res.ok) {
        const data = await res.json();
        setTursoStatus(data);
      }
    } catch (err) {
      console.warn('Erro ao consultar status Turso:', err);
    }
  };

  useEffect(() => {
    loadUsers();
    checkTursoStatus();
  }, []);

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Abrir modal de edição
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password || '',
      role: user.role,
      status: user.status
    });
  };

  // Salvar edição
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await userService.update(editingUser.id, formData);
      success(`Usuário ${formData.name} atualizado com sucesso!`);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      showError(err.message || 'Erro ao atualizar dados do usuário.');
    }
  };

  // Criar novo usuário
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.create(formData);
      success('Novo usuário cadastrado com sucesso!');
      setIsCreateOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'user', status: 'active' });
      loadUsers();
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      showError(err.message || 'Erro ao criar usuário.');
    }
  };

  // Alternar status ativo/inativo
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await userService.update(user.id, { status: newStatus });
      success(`Status do usuário ${user.name} alterado para ${newStatus === 'active' ? 'Ativo' : 'Inativo'}.`);
      loadUsers();
    } catch (err) {
      showError(err.message || 'Erro ao alterar status.');
    }
  };

  // Excluir usuário
  const handleDeleteUser = async (user) => {
    if (user.id === 1) {
      showError('Não é permitido excluir o Administrador principal.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      await userService.remove(user.id);
      success('Usuário removido com sucesso.');
      loadUsers();
    } catch (err) {
      showError(err.message || 'Erro ao excluir usuário.');
    }
  };

  // Inspecionar carteira do usuário
  const handleInspectPortfolio = async (user) => {
    setInspectLoading(true);
    setInspectingUser({ user, transactions: [], totalInvested: 0 });
    try {
      const data = await userService.getPortfolio(user.id);
      setInspectingUser(data);
    } catch (err) {
      console.error('Erro ao inspecionar carteira:', err);
      showError('Erro ao buscar movimentações do usuário.');
    } finally {
      setInspectLoading(false);
    }
  };

  // Filtro de busca
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    String(u.id).includes(search)
  );

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const totalVolume = users.reduce((sum, u) => sum + (Number(u.total_volume) || 0), 0);
  const totalTransactions = users.reduce((sum, u) => sum + (Number(u.total_transactions) || 0), 0);

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-title">
          <div className="admin-icon-badge">
            <Shield size={24} />
          </div>
          <div>
            <h1>Painel do Superusuário</h1>
            <p>Gerencie todos os investidores, credenciais de acesso e audite o banco de dados.</p>
          </div>
        </div>

        <div className="admin-actions">
          <button className="btn-refresh" onClick={loadUsers} title="Atualizar Lista">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button 
            className="btn-create" 
            onClick={() => {
              setFormData({ name: '', email: '', password: '', role: 'user', status: 'active' });
              setIsCreateOpen(true);
            }}
          >
            <UserPlus size={16} />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-label">Total de Usuários</div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-hint">{activeUsers} ativos no sistema</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">Status da Base</div>
          <div className="stat-value text-emerald">{activeUsers}/{totalUsers}</div>
          <div className="stat-hint">{totalUsers - activeUsers} contas inativas</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">Total de Transações</div>
          <div className="stat-value text-brand">{totalTransactions}</div>
          <div className="stat-hint">Compras e vendas registradas</div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-label">Volume Total Movimentado</div>
          <div className="stat-value">
            R$ {Number(totalVolume).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-hint">Total somado em carteiras</div>
        </div>
      </div>

      {/* Banner de Persistência em Nuvem (Turso Cloud) */}
      <div className={`turso-cloud-banner ${tursoStatus?.connected ? 'connected' : 'pending'}`}>
        <div className="turso-banner-left">
          <Cloud size={20} />
          <div>
            <strong>Persistência em Nuvem: </strong>
            {tursoStatus?.connected ? (
              <span>Turso Cloud conectado e ativo. Seus dados e cadastros estão salvos de forma definitiva.</span>
            ) : (
              <span>Armazenamento local ativo. Para sincronização contínua entre deploys no Render, vincule as variáveis <code>TURSO_DATABASE_URL</code> e <code>TURSO_AUTH_TOKEN</code>.</span>
            )}
          </div>
        </div>
        <div className={`turso-status-badge ${tursoStatus?.connected ? 'connected' : 'pending'}`}>
          <Database size={12} />
          <span>{tursoStatus?.connected ? 'Nuvem Conectada' : 'Modo Local'}</span>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="admin-search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Pesquisar por nome, login/e-mail ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="search-count">{filteredUsers.length} de {totalUsers} usuários</span>
      </div>

      {/* Tabela de Usuários */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading">
            <div className="spinner"></div>
            <p>Carregando banco de usuários...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty">
            <p>Nenhum usuário encontrado para esta busca.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Login / E-mail</th>
                <th>Senha</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Transações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isPassVisible = showPasswords[u.id];
                return (
                  <tr key={u.id} className={u.status === 'inactive' ? 'row-inactive' : ''}>
                    <td className="col-id">#{u.id}</td>
                    <td className="col-name font-bold">
                      <div className="user-name-cell">
                        <div className={`user-avatar ${u.role === 'admin' ? 'avatar-admin' : ''}`}>
                          {u.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span>{u.name}</span>
                          {u.id === 1 && <span className="badge-root">Master</span>}
                        </div>
                      </div>
                    </td>
                    <td className="col-email">{u.email}</td>
                    <td className="col-pass">
                      <div className="password-display">
                        <span className="password-text">
                          {isPassVisible ? u.password : '••••••••'}
                        </span>
                        <button 
                          className="btn-toggle-eye" 
                          onClick={() => togglePasswordVisibility(u.id)}
                          title={isPassVisible ? 'Ocultar Senha' : 'Ver Senha'}
                        >
                          {isPassVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                        {u.role === 'admin' ? '👑 Admin' : '👤 Investidor'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`status-badge ${u.status === 'active' ? 'status-active' : 'status-inactive'}`}
                        onClick={() => handleToggleStatus(u)}
                        title="Clique para alternar o status do usuário"
                      >
                        {u.status === 'active' ? '● Ativo' : '○ Inativo'}
                      </button>
                    </td>
                    <td>
                      <span className="tx-count-badge">
                        {u.total_transactions || 0} ordens
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button 
                          className="btn-action btn-inspect" 
                          onClick={() => handleInspectPortfolio(u)}
                          title="Inspecionar Carteira e Ordens"
                        >
                          <FolderSearch size={15} />
                        </button>

                        <button 
                          className="btn-action btn-edit" 
                          onClick={() => handleOpenEdit(u)}
                          title="Alterar Login, Senha e Dados"
                        >
                          <Edit3 size={15} />
                        </button>

                        {u.id !== 1 && (
                          <button 
                            className="btn-action btn-delete" 
                            onClick={() => handleDeleteUser(u)}
                            title="Excluir Usuário"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Editar Credenciais / Usuário */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Alterar Login e Senha</h2>
              <button className="btn-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label>Nome do Usuário</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Login / E-mail</label>
                <input
                  type="text"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Nova Senha</label>
                <input
                  type="text"
                  required
                  value={formData.password}
                  placeholder="Digite a nova senha..."
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <span className="field-hint">A senha pode ser alterada diretamente aqui.</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Papel</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={editingUser.id === 1}
                  >
                    <option value="user">Investidor Padrão</option>
                    <option value="admin">Administrador (Superusuário)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    disabled={editingUser.id === 1}
                  >
                    <option value="active">Ativo (Permite Login)</option>
                    <option value="inactive">Inativo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setEditingUser(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Criar Novo Usuário */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Cadastrar Novo Usuário</h2>
              <button className="btn-close" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-group">
                <label>Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Login / E-mail</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: carlos@davi.com ou carlos123"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Senha de Acesso</label>
                <input
                  type="text"
                  required
                  placeholder="Defina a senha inicial..."
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Papel</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="user">Investidor Padrão</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status Inicial</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inspecionar Carteira do Usuário */}
      {inspectingUser && (
        <div className="modal-overlay">
          <div className="modal-card modal-lg">
            <div className="modal-header">
              <div>
                <h2>Carteira de {inspectingUser.user?.name}</h2>
                <p className="modal-subtitle">Login: {inspectingUser.user?.email} • ID #{inspectingUser.user?.id}</p>
              </div>
              <button className="btn-close" onClick={() => setInspectingUser(null)}>✕</button>
            </div>

            <div className="inspect-body">
              <div className="inspect-stats">
                <div className="inspect-stat-pill">
                  <span>Total de Ordens:</span>
                  <strong>{inspectingUser.totalTransactions || 0}</strong>
                </div>
                <div className="inspect-stat-pill">
                  <span>Total Aportado:</span>
                  <strong className="text-emerald">
                    R$ {Number(inspectingUser.totalInvested || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {inspectLoading ? (
                <div className="inspect-loading">
                  <div className="spinner"></div>
                  <p>Consultando ordens no banco de dados...</p>
                </div>
              ) : (!inspectingUser.transactions || inspectingUser.transactions.length === 0) ? (
                <div className="inspect-empty">
                  <p>Este usuário ainda não possui ordens ou ativos cadastrados na carteira.</p>
                </div>
              ) : (
                <div className="inspect-table-wrapper">
                  <table className="inspect-table">
                    <thead>
                      <tr>
                        <th>Ativo</th>
                        <th>Tipo</th>
                        <th>Qtd</th>
                        <th>Preço</th>
                        <th>Total</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectingUser.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td className="font-bold text-brand">{tx.asset_code}</td>
                          <td>
                            <span className={`tx-type-pill ${tx.type === 'buy' ? 'type-buy' : 'type-sell'}`}>
                              {tx.type === 'buy' ? 'Compra' : 'Venda'}
                            </span>
                          </td>
                          <td>{tx.quantity}</td>
                          <td>R$ {Number(tx.price).toFixed(2)}</td>
                          <td className="font-bold">R$ {Number(tx.total_value || (tx.quantity * tx.price)).toFixed(2)}</td>
                          <td>{tx.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setInspectingUser(null)}>
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;
