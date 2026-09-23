import { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  PiggyBank, 
  PlusCircle, 
  MinusCircle, 
  Info, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Clock,
  Percent
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './ReservaEmergencia.css';

const ReservaEmergencia = () => {
  const { 
    emergencyReserveSummary, 
    updateEmergencyConfig, 
    addTransaction 
  } = usePortfolio();

  // Estados locais do formulário de configuração da reserva
  const [monthlyExpense, setMonthlyExpense] = useState(emergencyReserveSummary?.monthlyExpense || 3000);
  const [monthsTarget, setMonthsTarget] = useState(emergencyReserveSummary?.monthsTarget || 6);
  const [profileType, setProfileType] = useState(emergencyReserveSummary?.profileType || 'clt');
  const [strategyMode, setStrategyMode] = useState(emergencyReserveSummary?.strategyMode || 'hybrid_70_30');
  const [manualBalance, setManualBalance] = useState(emergencyReserveSummary?.manualReserveBalance || 0);

  // Projeção de aporte mensal
  const [monthlyContribution, setMonthlyContribution] = useState(1000);

  // Indicador de taxa SELIC/CDI do BACEN
  const [selicRate, setSelicRate] = useState(10.75); // Taxa anual estimada padrão
  const [isLoadingSelic, setIsLoadingSelic] = useState(false);

  // Modais de Aporte Rápido e Resgate
  const [showAporteModal, setShowAporteModal] = useState(false);
  const [showResgateModal, setShowResgateModal] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('TESOURO_SELIC_2029');
  const [transactionNotes, setTransactionNotes] = useState('');

  // Sincronizar com mudanças do context
  useEffect(() => {
    if (emergencyReserveSummary) {
      setMonthlyExpense(emergencyReserveSummary.monthlyExpense || 3000);
      setMonthsTarget(emergencyReserveSummary.monthsTarget || 6);
      setProfileType(emergencyReserveSummary.profileType || 'clt');
      setStrategyMode(emergencyReserveSummary.strategyMode || 'hybrid_70_30');
      setManualBalance(emergencyReserveSummary.manualReserveBalance || 0);
    }
  }, [emergencyReserveSummary]);

  // Buscar Selic atual do backend/BACEN
  useEffect(() => {
    const fetchSelic = async () => {
      try {
        setIsLoadingSelic(true);
        const res = await fetch('/api/economic/SELIC');
        if (res.ok) {
          const data = await res.json();
          if (data && data.value) {
            setSelicRate(Number(data.value));
          }
        }
      } catch (err) {
        console.warn('Usando taxa Selic de referência:', err.message);
      } finally {
        setIsLoadingSelic(false);
      }
    };
    fetchSelic();
  }, []);

  // Salvar alterações de configuração no Context e LocalStorage
  const handleSaveConfig = (updates) => {
    updateEmergencyConfig(updates);
  };

  const handleProfilePreset = (type, months) => {
    setProfileType(type);
    setMonthsTarget(months);
    handleSaveConfig({ profileType: type, monthsTarget: months });
  };

  // Cálculos dinâmicos
  const totalReserve = emergencyReserveSummary?.totalCurrentReserve || 0;
  const targetReserve = (monthlyExpense || 0) * (monthsTarget || 6);
  const missingAmount = Math.max(0, targetReserve - totalReserve);
  const completionPercent = targetReserve > 0 
    ? Math.min(100, (totalReserve / targetReserve) * 100) 
    : 100;
  const monthsCovered = monthlyExpense > 0 ? (totalReserve / monthlyExpense) : 0;

  // Projeção de meses restantes para concluir com o aporte informado
  const monthsRemaining = monthlyContribution > 0 
    ? Math.ceil(missingAmount / monthlyContribution) 
    : 0;

  // Rendimento anual e mensal estimado com base na taxa Selic
  const annualYield = totalReserve * (selicRate / 100);
  const monthlyYield = annualYield / 12;

  // Submeter Aporte Rápido
  const handleConfirmAporte = async (e) => {
    e.preventDefault();
    const val = parseFloat(transactionAmount);
    if (!val || val <= 0) return alert('Informe um valor válido.');

    await addTransaction({
      asset_code: selectedAsset,
      category: 'fixed',
      type: 'buy',
      quantity: 1,
      price: val,
      total_value: val,
      date: new Date().toISOString().split('T')[0],
      notes: transactionNotes || 'Aporte para Reserva de Emergência'
    });

    setShowAporteModal(false);
    setTransactionAmount('');
    setTransactionNotes('');
  };

  // Submeter Resgate de Emergência
  const handleConfirmResgate = async (e) => {
    e.preventDefault();
    const val = parseFloat(transactionAmount);
    if (!val || val <= 0) return alert('Informe um valor válido.');
    if (val > totalReserve) return alert('Valor de resgate excede o saldo da reserva.');

    await addTransaction({
      asset_code: selectedAsset,
      category: 'fixed',
      type: 'sell',
      quantity: 1,
      price: val,
      total_value: val,
      date: new Date().toISOString().split('T')[0],
      notes: transactionNotes || 'Resgate de Emergência'
    });

    setShowResgateModal(false);
    setTransactionAmount('');
    setTransactionNotes('');
  };

  return (
    <div className="reserva-page">
      {/* 1. Header com Título e Ações Rápidas */}
      <div className="reserva-header">
        <div className="reserva-header-title">
          <h1>
            <PiggyBank size={32} color="#04d361" />
            Reserva de Emergência
          </h1>
          <p>Sua fortaleza de proteção patrimonial antes de qualquer exposição ao risco.</p>
        </div>

        <div className="reserva-header-actions">
          <button 
            className="btn-reserva-action primary"
            onClick={() => setShowAporteModal(true)}
          >
            <PlusCircle size={18} />
            Novo Aporte na Reserva
          </button>
          <button 
            className="btn-reserva-action secondary"
            onClick={() => setShowResgateModal(true)}
          >
            <MinusCircle size={18} />
            Registrar Resgate
          </button>
          <Link to="/onde-aportar" className="btn-reserva-action secondary">
            Ver Onde Aportar <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* 2. Grid de Métricas Principais */}
      <div className="reserva-metrics-grid">
        <div className="reserva-metric-card highlight">
          <div className="metric-header">
            <span className="metric-label">Meta da Reserva</span>
            <DollarSign size={20} className="metric-icon" />
          </div>
          <div className="metric-value">R$ {targetReserve.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          <div className="metric-footer">{monthsTarget} meses de custo essencial (R$ {Number(monthlyExpense).toFixed(0)}/mês)</div>
        </div>

        <div className="reserva-metric-card">
          <div className="metric-header">
            <span className="metric-label">Saldo Acumulado</span>
            <ShieldCheck size={20} color="#04d361" />
          </div>
          <div className="metric-value" style={{ color: '#04d361' }}>
            R$ {totalReserve.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="metric-footer">
            {emergencyReserveSummary?.reserveAssets?.length || 0} ativo(s) de alta liquidez
          </div>
        </div>

        <div className="reserva-metric-card">
          <div className="metric-header">
            <span className="metric-label">Tempo de Cobertura</span>
            <Calendar size={20} color="#38bdf8" />
          </div>
          <div className="metric-value" style={{ color: '#38bdf8' }}>
            {monthsCovered.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>meses</span>
          </div>
          <div className="metric-footer">
            {missingAmount > 0 
              ? `Faltam R$ ${missingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${((missingAmount / (monthlyExpense || 1))).toFixed(1)} meses)`
              : '100% Protegido'}
          </div>
        </div>

        <div className="reserva-metric-card">
          <div className="metric-header">
            <span className="metric-label">Rentabilidade Soberana</span>
            <Percent size={20} color="#fbbf24" />
          </div>
          <div className="metric-value" style={{ color: '#fbbf24' }}>
            {selicRate.toFixed(2)}% <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>a.a. (Selic/CDI)</span>
          </div>
          <div className="metric-footer">Rendimento de ~R$ {monthlyYield.toFixed(2)}/mês</div>
        </div>
      </div>

      {/* 3. Termômetro Visual e Barra de Progresso */}
      <div className="reserva-progress-box">
        <div className="progress-box-header">
          <div className="progress-box-title">
            <TrendingUp size={22} color="#04d361" />
            Progresso da Blindagem Financeira
          </div>
          <span className={`progress-badge ${emergencyReserveSummary?.reserveStatus || 'critico'}`}>
            {emergencyReserveSummary?.reserveStatus === 'blindada' && '🛡️ Reserva Blindada'}
            {emergencyReserveSummary?.reserveStatus === 'quase_blindada' && '🟡 Quase Blindada'}
            {emergencyReserveSummary?.reserveStatus === 'em_construcao' && '🟠 Em Construção'}
            {emergencyReserveSummary?.reserveStatus === 'critico' && '🔴 Nível Crítico'}
          </span>
        </div>

        <div className="progress-bar-track">
          <div 
            className={`progress-bar-fill ${emergencyReserveSummary?.reserveStatus || 'critico'}`}
            style={{ width: `${Math.max(5, completionPercent)}%` }}
          >
            {completionPercent >= 15 && `${completionPercent.toFixed(1)}%`}
          </div>
        </div>

        <div className="progress-milestones">
          <span>0 meses (0%)</span>
          <span>3 meses (50%)</span>
          <span>6 meses (100% Alvo)</span>
          <span>12 meses (Segurança Máxima)</span>
        </div>

        <div className="progress-message">
          {emergencyReserveSummary?.reserveStatus === 'blindada' ? (
            <span>
              ✅ <strong>Excelente trabalho!</strong> Sua reserva de emergência está 100% constituída. Seu patrimônio está protegido contra imprevistos e o motor <strong>AM2O</strong> já pode direcionar todos os novos aportes para acelerar sua carteira de investimentos.
            </span>
          ) : (
            <span>
              ⚠️ <strong>Atenção ao Método DAVI:</strong> Você possui atualmente <strong>{monthsCovered.toFixed(1)} meses</strong> de despesas cobertas. O sistema recomenda manter a prioridade em <strong>{strategyMode === 'focus_100' ? '100% Reserva' : '70% Reserva / 30% Carteira'}</strong> para atingir a meta de R$ {targetReserve.toFixed(2)} o quanto antes.
            </span>
          )}
        </div>
      </div>

      {/* 4. Duas Colunas: Configurações & Projeções */}
      <div className="reserva-main-grid">
        {/* Coluna 1: Configuração do Custo de Vida e Perfil */}
        <div className="reserva-section-card">
          <h3 className="section-card-title">
            <Info size={20} color="#04d361" />
            1. Planejamento de Custo e Perfil
          </h3>

          <div className="form-group">
            <label>Custo de Vida Mensal Essencial</label>
            <div className="input-money-wrapper">
              <span>R$</span>
              <input
                type="number"
                value={monthlyExpense}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setMonthlyExpense(val);
                  handleSaveConfig({ monthlyExpense: val });
                }}
                step="100"
                min="0"
              />
            </div>
            <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
              Inclui moradia, alimentação básica, saúde, contas de luz/água e transporte.
            </small>
          </div>

          <div className="form-group">
            <label>Perfil Profissional (Preset de Meses)</label>
            <div className="profile-preset-buttons">
              <button
                type="button"
                className={`btn-profile-preset ${profileType === 'publico' ? 'active' : ''}`}
                onClick={() => handleProfilePreset('publico', 4)}
              >
                <span>🏛️ Concursado</span>
                <small>3 a 4 meses</small>
              </button>

              <button
                type="button"
                className={`btn-profile-preset ${profileType === 'clt' ? 'active' : ''}`}
                onClick={() => handleProfilePreset('clt', 6)}
              >
                <span>🏢 CLT Privado</span>
                <small>6 meses</small>
              </button>

              <button
                type="button"
                className={`btn-profile-preset ${profileType === 'autonomo' ? 'active' : ''}`}
                onClick={() => handleProfilePreset('autonomo', 12)}
              >
                <span>💼 Autônomo / PJ</span>
                <small>12 meses</small>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Meses de Cobertura Desejados: <strong>{monthsTarget} meses</strong></label>
            <input
              type="range"
              min="3"
              max="24"
              step="1"
              value={monthsTarget}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setMonthsTarget(val);
                setProfileType('custom');
                handleSaveConfig({ monthsTarget: val, profileType: 'custom' });
              }}
              style={{ width: '100%', accentColor: '#04d361', cursor: 'pointer' }}
            />
          </div>

          <div className="form-group">
            <label>Estratégia de Aporte quando Incompleta</label>
            <select
              value={strategyMode}
              onChange={(e) => {
                setStrategyMode(e.target.value);
                handleSaveConfig({ strategyMode: e.target.value });
              }}
              style={{
                width: '100%',
                background: '#202024',
                border: '1px solid #323238',
                color: '#fff',
                padding: '0.65rem',
                borderRadius: '6px'
              }}
            >
              <option value="focus_100">🛡️ Foco Total (100% dos novos aportes na Reserva)</option>
              <option value="hybrid_70_30">⚖️ Aporte Híbrido (70% Reserva / 30% Carteira)</option>
              <option value="hybrid_50_50">🎯 Meio a Meio (50% Reserva / 50% Carteira)</option>
              <option value="free">🔓 Livre (Decidir a cada aporte)</option>
            </select>
          </div>
        </div>

        {/* Coluna 2: Projeção de Tempo e Rendimentos */}
        <div className="reserva-section-card">
          <h3 className="section-card-title">
            <Clock size={20} color="#38bdf8" />
            2. Simulador de Conclusão e Rendimento
          </h3>

          <div className="form-group">
            <label>Simular Aporte Mensal Destinado à Reserva</label>
            <div className="input-money-wrapper">
              <span>R$</span>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
                step="100"
                min="0"
              />
            </div>
          </div>

          <div className="projection-box">
            <div className="projection-row">
              <span className="projection-label">Tempo estimado para blindar a reserva:</span>
              <span className="projection-val highlight">
                {missingAmount === 0 
                  ? 'Concluída!' 
                  : `${monthsRemaining} ${monthsRemaining === 1 ? 'mês' : 'meses'}`}
              </span>
            </div>
            <div className="projection-row">
              <span className="projection-label">Rendimento bruto anual estimado (Selic):</span>
              <span className="projection-val">R$ {annualYield.toFixed(2)}/ano</span>
            </div>
            <div className="projection-row">
              <span className="projection-label">Rendimento bruto mensal médio:</span>
              <span className="projection-val">R$ {monthlyYield.toFixed(2)}/mês</span>
            </div>
            <div className="projection-row">
              <span className="projection-label">Garantia e Proteção:</span>
              <span className="projection-val" style={{ color: '#04d361' }}>FGC até R$ 250k / Tesouro Nacional</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.4 }}>
            💡 <em>A reserva não visa enriquecer ou bater recordes de rentabilidade, mas sim garantir paz de espírito para que você nunca precise vender ações ou fundos imobiliários na baixa durante uma crise.</em>
          </p>
        </div>
      </div>

      {/* 5. Tabela de Ativos da Reserva */}
      <div className="reserva-section-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="section-card-title" style={{ margin: 0 }}>
            <ShieldCheck size={20} color="#04d361" />
            Ativos que Compõem sua Reserva
          </h3>
          <button 
            className="btn-reserva-action primary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
            onClick={() => setShowAporteModal(true)}
          >
            <PlusCircle size={15} /> Aportar
          </button>
        </div>

        {(!emergencyReserveSummary?.reserveAssets || emergencyReserveSummary.reserveAssets.length === 0) ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p>Nenhum ativo de liquidez diária cadastrado na carteira.</p>
            <p style={{ fontSize: '0.85rem' }}>Cadastre um título como <code>TESOURO_SELIC_2029</code> ou <code>CDB_LIQ_DIARIA</code> para acompanhar automaticamente.</p>
          </div>
        ) : (
          <table className="reserva-assets-table">
            <thead>
              <tr>
                <th>ATIVO / TÍTULO</th>
                <th>TIPO / LIQUIDEZ</th>
                <th>QUANTIDADE</th>
                <th>VALOR INVESTIDO</th>
                <th>PARTICIPAÇÃO NA RESERVA</th>
              </tr>
            </thead>
            <tbody>
              {emergencyReserveSummary.reserveAssets.map(asset => {
                const totalInvested = asset.quantity * (asset.currentPrice || asset.averagePrice || 1);
                const sharePercent = totalReserve > 0 ? (totalInvested / totalReserve) * 100 : 0;
                return (
                  <tr key={asset.code}>
                    <td>
                      <strong style={{ color: '#fff' }}>{asset.code}</strong>
                    </td>
                    <td>
                      <span className="asset-badge-selic">Liquidez Diária (D+0/D+1)</span>
                    </td>
                    <td>{asset.quantity}</td>
                    <td style={{ color: '#04d361', fontWeight: 600 }}>
                      R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>{sharePercent.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 6. Guia Prático: O que Serve e o que Não Serve */}
      <div className="reserva-guide-grid">
        <div className="guide-box positive">
          <h4 className="guide-box-title">
            <CheckCircle2 size={20} color="#04d361" />
            Onde Guardar sua Reserva (Adequado)
          </h4>
          <ul className="guide-list">
            <li>
              <strong style={{ color: '#fff' }}>Tesouro Selic:</strong> Risco soberano (o investimento mais seguro do Brasil), liquidez diária e rendimento pós-fixado sem oscilação negativa.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>CDB com Liquidez Diária (100%+ do CDI):</strong> Emitido por bancos sólidos com resgate imediato a qualquer dia e garantia do FGC até R$ 250 mil.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Contas Remuneradas:</strong> Contas digitais com rendimento automático de 100% do CDI e liquidez imediata.
            </li>
          </ul>
        </div>

        <div className="guide-box negative">
          <h4 className="guide-box-title">
            <XCircle size={20} color="#ef4444" />
            Onde NUNCA Guardar a Reserva (Inadequado)
          </h4>
          <ul className="guide-list">
            <li>
              <strong style={{ color: '#fff' }}>Ações e FIIs:</strong> Renda variável tem oscilação diária. Em uma emergência, você pode ser forçado a vender com prejuízo.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Títulos Prefixados ou IPCA+ longo:</strong> Sofrem com a marcação a mercado e podem apresentar rentabilidade negativa no resgate antecipado.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>CDBs/LCIs sem liquidez diária:</strong> Dinheiro preso por 1, 2 ou 3 anos que não pode ser resgatado em emergências.
            </li>
            <li>
              <strong style={{ color: '#fff' }}>Criptomoedas / Day Trade:</strong> Volatilidade extrema incompatível com a preservação do capital essencial.
            </li>
          </ul>
        </div>
      </div>

      {/* Modal de Aporte Rápido */}
      {showAporteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Novo Aporte na Reserva de Emergência</h3>
              <button className="btn-close-modal" onClick={() => setShowAporteModal(false)}>×</button>
            </div>
            <form onSubmit={handleConfirmAporte}>
              <div className="form-group">
                <label>Ativo de Destino</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  style={{ width: '100%', background: '#202024', border: '1px solid #323238', color: '#fff', padding: '0.65rem', borderRadius: '6px' }}
                >
                  <option value="TESOURO_SELIC_2029">Tesouro Selic 2029 (Soberano)</option>
                  <option value="CDB_LIQ_DIARIA">CDB 100% CDI Liquidez Diária</option>
                  <option value="TESOURO_SELIC_2026">Tesouro Selic 2026</option>
                </select>
              </div>

              <div className="form-group">
                <label>Valor do Aporte (R$)</label>
                <div className="input-money-wrapper">
                  <span>R$</span>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    step="0.01"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observação (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Aporte mensal reserva"
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  style={{ width: '100%', background: '#202024', border: '1px solid #323238', color: '#fff', padding: '0.65rem', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn-reserva-action secondary"
                  onClick={() => setShowAporteModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-reserva-action primary">
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Resgate de Emergência */}
      {showResgateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Registrar Resgate de Emergência</h3>
              <button className="btn-close-modal" onClick={() => setShowResgateModal(false)}>×</button>
            </div>
            <form onSubmit={handleConfirmResgate}>
              <div className="form-group">
                <label>Ativo a Resgatar</label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  style={{ width: '100%', background: '#202024', border: '1px solid #323238', color: '#fff', padding: '0.65rem', borderRadius: '6px' }}
                >
                  {emergencyReserveSummary?.reserveAssets?.map(a => (
                    <option key={a.code} value={a.code}>{a.code} (Saldo: R$ {(a.quantity * (a.currentPrice || a.averagePrice || 1)).toFixed(2)})</option>
                  )) || <option value="TESOURO_SELIC_2029">TESOURO_SELIC_2029</option>}
                </select>
              </div>

              <div className="form-group">
                <label>Valor a Resgatar (R$)</label>
                <div className="input-money-wrapper">
                  <span>R$</span>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    step="0.01"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Motivo da Emergência (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Reparo urgente do carro"
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  style={{ width: '100%', background: '#202024', border: '1px solid #323238', color: '#fff', padding: '0.65rem', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn-reserva-action secondary"
                  onClick={() => setShowResgateModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-reserva-action primary"
                  style={{ background: '#ef4444', color: '#fff' }}
                >
                  Confirmar Resgate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservaEmergencia;
