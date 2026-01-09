import TransactionForm from '../components/Portfolio/TransactionForm';
import HoldingsTable from '../components/Portfolio/HoldingsTable';
import '../components/Portfolio/Portfolio.css';

const Carteira = () => {
  return (
    <div className="carteira-page">
      <div className="portfolio-header">
        <h1>Minha Carteira</h1>
      </div>

      <section>
        <TransactionForm />
      </section>

      <section className="holdings-grid">
        <HoldingsTable category="acoes" title="Ações" color="#F4A460" />
        <HoldingsTable category="fiis" title="FIIs" color="#C0C0C0" />
        <HoldingsTable category="stocks" title="Stocks" color="#FFD700" />
        <HoldingsTable category="reits" title="REITs" color="#FFFF00" />
      </section>
    </div>
  );
};

export default Carteira;
