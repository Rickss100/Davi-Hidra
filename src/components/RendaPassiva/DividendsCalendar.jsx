import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  X,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import './DividendsCalendar.css';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DividendsCalendar = ({ userId = 1 }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [calendarData, setCalendarData] = useState({ totalIncomeBRL: 0, days: {}, events: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState(null);

  // Buscar dados de proventos ao mudar mês/ano ou usuário
  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/dividends/calendar?userId=${userId}&year=${currentYear}&month=${currentMonth}`);
        if (res.ok) {
          const data = await res.json();
          setCalendarData(data);
        }
      } catch (err) {
        console.error('Erro ao buscar calendário:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendar();
  }, [userId, currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Construção dos dias do calendário
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayWeekIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 (Dom) a 6 (Sáb)

  const emptyCells = Array.from({ length: firstDayWeekIndex });
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getCategoryClass = (category) => {
    const c = String(category || '').toLowerCase();
    if (c.includes('fii')) return 'fii';
    if (c.includes('acao') || c.includes('ação')) return 'acao';
    if (c.includes('reit')) return 'reit';
    if (c.includes('stock')) return 'stock';
    return 'acao';
  };

  const isToday = (day) => {
    return today.getFullYear() === currentYear &&
           today.getMonth() + 1 === currentMonth &&
           today.getDate() === day;
  };

  const handleCellClick = (day) => {
    const dayData = calendarData.days?.[day];
    if (dayData && dayData.payments && dayData.payments.length > 0) {
      setSelectedDayData(dayData);
    } else {
      setSelectedDayData({
        day,
        date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        totalDayBRL: 0,
        payments: []
      });
    }
  };

  return (
    <div className="dividends-calendar-container">
      {/* Barra Superior com Seletor de Mês e Total */}
      <div className="calendar-top-bar">
        <div className="calendar-month-selector">
          <button className="calendar-nav-btn" onClick={handlePrevMonth} title="Mês anterior">
            <ChevronLeft size={20} />
          </button>
          
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
            style={{
              background: '#202024',
              border: '1px solid #323238',
              color: '#f3f4f6',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>{name}</option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
            style={{
              background: '#202024',
              border: '1px solid #323238',
              color: '#f3f4f6',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {[2024, 2025, 2026, 2027, 2028].map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <button className="calendar-nav-btn" onClick={handleNextMonth} title="Próximo mês">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="calendar-summary-pill">
          <DollarSign size={18} />
          <span>Total no Mês: R$ {calendarData.totalIncomeBRL?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Legenda de Categorias */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot fii"></span>
          <span>FIIs (Mensal)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot acao"></span>
          <span>Ações B3</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot reit"></span>
          <span>REITs (EUA)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot stock"></span>
          <span>Stocks (EUA)</span>
        </div>
      </div>

      {/* Grid do Calendário */}
      <div className="calendar-grid">
        {/* Cabeçalho dos dias da semana */}
        {WEEK_DAYS.map(dayName => (
          <div key={dayName} className="calendar-day-header">
            {dayName}
          </div>
        ))}

        {/* Células vazias antes do 1º dia do mês */}
        {emptyCells.map((_, idx) => (
          <div key={`empty-${idx}`} className="calendar-cell empty"></div>
        ))}

        {/* Dias do Mês */}
        {dayNumbers.map(day => {
          const dayInfo = calendarData.days?.[day];
          const hasPayments = dayInfo && dayInfo.payments && dayInfo.payments.length > 0;
          const isCurrentDay = isToday(day);

          return (
            <div
              key={`day-${day}`}
              className={`calendar-cell ${hasPayments ? 'has-payments' : ''} ${isCurrentDay ? 'today' : ''}`}
              onClick={() => handleCellClick(day)}
            >
              <div className="cell-top">
                <span className="cell-day-number">{day}</span>
                {isCurrentDay && <span className="cell-today-badge">Hoje</span>}
              </div>

              {hasPayments && (
                <div className="cell-chips-container">
                  {dayInfo.payments.slice(0, 3).map(p => (
                    <div key={`${p.id}-${p.assetCode}`} className={`dividend-chip ${getCategoryClass(p.category)}`}>
                      <span>{p.assetCode}</span>
                      <span>R$ {p.totalAmountBRL.toFixed(0)}</span>
                    </div>
                  ))}
                  {dayInfo.payments.length > 3 && (
                    <div style={{ fontSize: '0.65rem', color: '#9ca3af', textAlign: 'center' }}>
                      +{dayInfo.payments.length - 3} mais
                    </div>
                  )}
                </div>
              )}

              {hasPayments && (
                <div className="cell-day-total">
                  +R$ {dayInfo.totalDayBRL.toFixed(2)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhamento ao Clicar no Dia */}
      {selectedDayData && (
        <div className="day-modal-overlay" onClick={() => setSelectedDayData(null)}>
          <div className="day-modal-content" onClick={e => e.stopPropagation()}>
            <div className="day-modal-header">
              <div>
                <h3>
                  Proventos em {selectedDayData.day} de {MONTH_NAMES[currentMonth - 1]} de {currentYear}
                </h3>
                <p>
                  {selectedDayData.payments.length > 0 
                    ? `${selectedDayData.payments.length} pagamento(s) programado(s)`
                    : 'Nenhum pagamento previsto para esta data'}
                </p>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedDayData(null)}>
                <X size={20} />
              </button>
            </div>

            {selectedDayData.payments.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                <Clock size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>Não há proventos creditados ou previstos nesta data para a sua carteira.</p>
              </div>
            ) : (
              <div className="day-payments-list">
                {selectedDayData.payments.map(item => (
                  <div key={item.id} className="day-payment-item">
                    <div className="payment-item-left">
                      <div className="payment-ticker-row">
                        <span className="payment-ticker">{item.assetCode}</span>
                        <span className={`payment-type-badge ${item.type}`}>
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="payment-name">{item.assetName}</span>
                      <span className="payment-detail-text">
                        {item.quantity} cotas × {item.isUSD ? `$ ${item.unitAmount.toFixed(3)}` : `R$ ${item.unitAmount.toFixed(2)}`} (Data COM: {item.exDate})
                      </span>
                    </div>

                    <div className="payment-item-right">
                      <span className="payment-total-amount">
                        + R$ {item.totalAmountBRL.toFixed(2)}
                      </span>
                      <span className="payment-status-tag">
                        {item.status === 'pago' ? '✅ Pago / Liquidado' : '⏳ Previsto'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedDayData.payments.length > 0 && (
              <div className="day-modal-footer">
                <span>Total a Receber no Dia:</span>
                <span className="total-val">R$ {selectedDayData.totalDayBRL.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DividendsCalendar;
