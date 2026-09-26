import React from 'react';
import { Link } from 'react-router-dom';

const Termos = () => {
  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', color: '#f8fafc', padding: '20px' }}>
      <h1>Termos de Uso e Política de Privacidade</h1>
      <p style={{ marginTop: '20px', lineHeight: '1.6' }}>
        <strong>1. Isenção de Responsabilidade</strong><br/>
        O Norte Invest (Método DAVI & HYDRA) é uma ferramenta educacional e matemática. 
        As sugestões geradas pelo algoritmo AM2O não configuram recomendação de compra ou venda de valores mobiliários, nos termos da regulamentação da CVM. 
        O investidor é o único responsável pelas suas decisões financeiras.
      </p>
      <p style={{ marginTop: '20px', lineHeight: '1.6' }}>
        <strong>2. Privacidade de Dados (LGPD)</strong><br/>
        Seus dados cadastrais e as informações inseridas sobre o portfólio são armazenados em ambiente seguro e 
        usados exclusivamente para o funcionamento dos cálculos da plataforma. Não vendemos ou compartilhamos seus dados com terceiros.
      </p>
      <div style={{ marginTop: '40px' }}>
        <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none' }}>Voltar</Link>
      </div>
    </div>
  );
};
export default Termos;