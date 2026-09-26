import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SetupChecklist = () => {
  const { emergencyReserveSummary, assetTargets, transactions } = usePortfolio();

  const isReserveConfigured = emergencyReserveSummary?.isConfigured;
  const isTargetSet = Object.values(assetTargets || {}).some(t => t.target > 0);
  const hasFirstTransaction = transactions && transactions.length > 0;

  const tasks = [
    {
      id: 1,
      title: 'Configurar Cinto de Segurança (Reserva)',
      completed: isReserveConfigured,
      link: '/reserva-emergencia',
      desc: 'Defina seu perfil e os meses de proteção.'
    },
    {
      id: 2,
      title: 'Definir Metas do AM2O',
      completed: isTargetSet,
      link: '/definir-objetivos',
      desc: 'Diga ao algoritmo qual % ideal de cada classe de ativo.'
    },
    {
      id: 3,
      title: 'Registrar Primeiro Aporte',
      completed: hasFirstTransaction,
      link: '/carteira',
      desc: 'Adicione suas posições atuais para gerar a carteira.'
    }
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  
  if (completedCount === tasks.length) return null; // Hide if fully completed

  return (
    <div style={{
      background: 'rgba(59, 130, 246, 0.05)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ color: '#60a5fa', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚀 Primeiros Passos: Bem-vindo(a)!
          </h3>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
            Complete as configurações essenciais para o Método DAVI calcular seus aportes.
          </p>
        </div>
        <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', color: '#60a5fa' }}>
          {completedCount} de {tasks.length}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tasks.map(task => (
          <Link key={task.id} to={task.link} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: task.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.2)',
              border: `1px solid ${task.completed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'}`,
              padding: '12px 16px',
              borderRadius: '6px',
              transition: 'background 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {task.completed ? <CheckCircle size={20} color="#10b981" /> : <Circle size={20} color="#64748b" />}
                <div>
                  <h4 style={{ margin: 0, color: task.completed ? '#10b981' : '#f8fafc', fontSize: '15px' }}>{task.title}</h4>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>{task.desc}</span>
                </div>
              </div>
              <ChevronRight size={16} color="#64748b" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SetupChecklist;
