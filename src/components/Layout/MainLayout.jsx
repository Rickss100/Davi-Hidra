import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from '../Header/Header';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="content">
        <Header />
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
