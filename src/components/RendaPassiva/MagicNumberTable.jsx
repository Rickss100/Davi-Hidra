import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import './MagicNumberTable.css';

const MagicNumberTable = ({ userId = 1 }) => {
  const [magicData, setMagicData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMagic = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/dividends/magic-number?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setMagicData(data);
        }
      } catch (err) {
        console.error('Erro ao buscar Número Mágico:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMagic();
  }, [userId]);

  return (
    <div className="magic-number-container">
      <div className="magic-header">
        <h2>
          <Sparkles size={24} color="#38bdf8" />
          Número Mágico (Efeito Bola de Neve Autônomo)
        </h2>
        <p>
          O <strong>Número Mágico</strong> é a quantidade exata de cotas que você precisa ter de um fundo ou ação para que os proventos mensais comprem <strong>1 nova cota sozinho</strong>, sem que você precise tirar nenhum centavo do próprio bolso.
        </p>
      </div>

      {magicData.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: '#18181c',
          border: '1px solid #27272a',
          borderRadius: '12px',
          color: '#94a3b8'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#f1f5f9', fontWeight: 600 }}>
            Nenhum ativo de renda encontrado em sua custódia.
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Adicione ações, FIIs ou REITs na aba <strong>Carteira</strong> para que o sistema calcule automaticamente a quantidade de cotas necessárias para que os proventos comprem novas cotas sozinhos!
          </p>
        </div>
      ) : (
        <div className="magic-grid">
          {magicData.map(item => (
            <div key={item.assetCode} className={`magic-card ${item.isMagicReached ? 'reached' : ''}`}>
              <div>
                <div className="magic-card-top">
                  <div>
                    <div className="magic-card-ticker">{item.assetCode}</div>
                    <div className="magic-card-name">{item.assetName}</div>
                  </div>
                  <span className={`magic-badge ${item.isMagicReached ? 'reached' : 'progress'}`}>
                    {item.isMagicReached ? '🎉 Bola de Neve Ativada!' : `${item.progressPercent}% Atingido`}
                  </span>
                </div>

                <div className="magic-progress-section">
                  <div className="magic-progress-labels">
                    <span>Suas Cotas: <strong>{item.quantity}</strong></span>
                    <span>Meta: <strong>{item.magicNumber} cotas</strong></span>
                  </div>
                  <div className="magic-progress-track">
                    <div 
                      className={`magic-progress-fill ${item.isMagicReached ? 'reached' : ''}`}
                      style={{ width: `${Math.min(100, item.progressPercent)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="magic-stats-row">
                <div>
                  Provento/mês: <strong>R$ {item.monthlyIncome.toFixed(2)}</strong>
                </div>
                <div>
                  Gera sozinho: <strong style={{ color: item.isMagicReached ? '#04d361' : '#38bdf8' }}>
                    {item.sharesPerMonth.toFixed(2)} cota(s)/mês
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MagicNumberTable;
