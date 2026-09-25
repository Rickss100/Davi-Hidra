import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PortfolioProvider } from './context/PortfolioContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home';
import Carteira from './pages/Carteira';
import OndeAportar from './pages/OndeAportar';
import DefinirObjetivos from './pages/DefinirObjetivos';
import ReservaEmergencia from './pages/ReservaEmergencia';
import RendaPassiva from './pages/RendaPassiva';
import Resumo from './pages/Resumo';
import Historico from './pages/Historico';
import RadarAtivos from './pages/RadarAtivos';
import AdminUsers from './pages/AdminUsers';
import Tutorial from './pages/Tutorial';
import Login from './pages/Login';
import './App.css';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Admin Protected Route Wrapper (acesso para superusuário e colaborador)
const AdminRoute = () => {
  const { user } = useAuth();
  if (!user || (user.role !== 'admin' && user.role !== 'collaborator')) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <PortfolioProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="carteira" element={<Carteira />} />
                  <Route path="onde-aportar" element={<OndeAportar />} />
                  <Route path="definir-objetivos" element={<DefinirObjetivos />} />
                  <Route path="reserva-emergencia" element={<ReservaEmergencia />} />
                  <Route path="renda-passiva" element={<RendaPassiva />} />
                  <Route path="resumo" element={<Resumo />} />
                  <Route path="historico" element={<Historico />} />
                  <Route path="radar" element={<RadarAtivos />} />
                  <Route path="tutorial" element={<Tutorial />} />
                  <Route element={<AdminRoute />}>
                    <Route path="admin" element={<AdminUsers />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </PortfolioProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
