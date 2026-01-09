import React from 'react';
import './SummaryStep.css';
import { Pencil } from 'lucide-react';

const SummaryStep = ({ 
    rendaFixa, 
    rendaVariavel, 
    brasil, 
    usa, 
    acoes, 
    fiis, 
    stocks, 
    reits,
    onEdit 
}) => {
    return (
        <div className="summary-step">
            <div className="tree-container">
                {/* Level 1: Macro Allocation */}
                <div className="tree-level level-1">
                    <div className="node-card" onClick={() => onEdit(1)}>
                        <div className="node-icon"><Pencil size={12} /></div>
                        <span className="node-title">Renda fixa</span>
                        <span className="node-value">{rendaFixa.toFixed(2)}%</span>
                    </div>
                    <div className="node-card" onClick={() => onEdit(1)}>
                        <div className="node-icon"><Pencil size={12} /></div>
                        <span className="node-title">Renda Variável</span>
                        <span className="node-value">{rendaVariavel.toFixed(2)}%</span>
                    </div>
                </div>

                {/* Connector Lines */}
                <div className="connector-lines level-1-lines">
                    <div className="line-hidden"></div>
                    <div className="line-connector-group">
                        <div className="line-vertical-right"></div>
                        <div className="line-horizontal"></div>
                        <div className="line-vertical-left"></div>
                        <div className="line-vertical-center"></div>
                    </div>
                </div>

                {/* Level 2: Geography (Under Renda Variável) */}
                <div className="tree-level level-2">
                    <div className="placeholder-node"></div> {/* Filler for alignment under Renda Fixa */}
                    <div className="geography-group">
                        <div className="node-card" onClick={() => onEdit(2)}>
                            <div className="node-icon"><Pencil size={12} /></div>
                            <span className="node-title">EUA</span>
                            <span className="node-value">{usa.toFixed(2)}%</span>
                        </div>
                        <div className="node-card" onClick={() => onEdit(2)}>
                            <div className="node-icon"><Pencil size={12} /></div>
                            <span className="node-title">Brasil</span>
                            <span className="node-value">{brasil.toFixed(2)}%</span>
                        </div>
                    </div>
                </div>

                 {/* Connector Lines Level 2 */}
                 <div className="connector-lines level-2-lines">
                    <div className="placeholder-line"></div>
                    <div className="group-left">
                        <div className="line-vertical-top"></div>
                        <div className="line-horizontal-small"></div>
                        <div className="line-vertical-small-left"></div>
                        <div className="line-vertical-small-right"></div>
                    </div>
                    <div className="group-right">
                        <div className="line-vertical-top"></div>
                        <div className="line-horizontal-small"></div>
                        <div className="line-vertical-small-left"></div>
                        <div className="line-vertical-small-right"></div>
                    </div>
                </div>

                {/* Level 3: Asset Classes */}
                <div className="tree-level level-3">
                         {/* EUA Children */}
                         <div className="placeholder-node"></div>
                        <div className="asset-group">
                            <div className="node-card" onClick={() => onEdit(4)}>
                                <div className="node-icon"><Pencil size={12} /></div>
                                <span className="node-title">REITs</span>
                                <span className="node-value">{reits.toFixed(2)}%</span>
                            </div>
                            <div className="node-card" onClick={() => onEdit(4)}>
                                <div className="node-icon"><Pencil size={12} /></div>
                                <span className="node-title">Stocks</span>
                                <span className="node-value">{stocks.toFixed(2)}%</span>
                            </div>
                        </div>
                   
                        {/* Brasil Children */}
                        <div className="asset-group">
                            <div className="node-card" onClick={() => onEdit(3)}>
                                <div className="node-icon"><Pencil size={12} /></div>
                                <span className="node-title">Ações</span>
                                <span className="node-value">{acoes.toFixed(2)}%</span>
                            </div>
                            <div className="node-card" onClick={() => onEdit(3)}>
                                <div className="node-icon"><Pencil size={12} /></div>
                                <span className="node-title">FIIs</span>
                                <span className="node-value">{fiis.toFixed(2)}%</span>
                            </div>
                        </div>
                </div>
            </div>

            <div className="success-message">
                <h2>Parabéns!</h2>
                <p>Todos os seus objetivos da carteira estão registrados.</p>
                <div className="instructions">
                    <p>*Para editar os objetivos clique em sua caixa ;</p>
                    <p>**Para editar objetivos de ações,stock,reits e fiis, clique no objetivo macro e depois em continuar.</p>
                </div>
            </div>
        </div>
    );
};

export default SummaryStep;
