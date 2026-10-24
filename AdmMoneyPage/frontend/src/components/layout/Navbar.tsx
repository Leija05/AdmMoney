import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Cookie,
  BarChart3,
  ScanLine,
  Plus,
  ShoppingBag,
  Sun,
  Moon
} from 'lucide-react';
import { BackendStatusBanner } from './BackendStatusBanner';
import { Button } from '../ui/Button';

interface NavbarProps {
  activeTab: 'dashboard' | 'orders' | 'expenses' | 'cookies' | 'analytics';
  onTabChange: (tab: 'dashboard' | 'orders' | 'expenses' | 'cookies' | 'analytics') => void;
  isBackendOnline: boolean;
  isMockMode: boolean;
  onToggleMockMode: () => void;
  onRefreshBackend: () => void;
  onOpenNewExpense: () => void;
  onOpenScanner: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  isBackendOnline,
  isMockMode,
  onToggleMockMode,
  onRefreshBackend,
  onOpenNewExpense,
  onOpenScanner,
  theme,
  onToggleTheme
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 25) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`nav-island-wrapper ${isScrolled ? 'scrolled' : 'at-top'}`}>
      <nav className="nav-island">
        {/* Brand logo & title */}
        <div className="nav-brand" onClick={() => onTabChange('dashboard')}>
          <div className="brand-icon-wrapper">
            <Cookie size={20} />
          </div>
          <div className="brand-title">
            Adm Money <span className="brand-badge">Bakery Pro</span>
          </div>
        </div>

        {/* Tab switcher with clear, non-technical everyday names */}
        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
            title="Resumen general de tu negocio"
          >
            <LayoutDashboard size={16} />
            <span>Resumen</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => onTabChange('orders')}
            title="Pedidos de clientes y preparación"
          >
            <ShoppingBag size={16} />
            <span>Pedidos</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => onTabChange('expenses')}
            title="Registro de compras y gastos"
          >
            <Receipt size={16} />
            <span>Gastos</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'cookies' ? 'active' : ''}`}
            onClick={() => onTabChange('cookies')}
            title="Tus recetas e inventario de ingredientes"
          >
            <Cookie size={16} />
            <span>Recetas & Almacén</span>
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onTabChange('analytics')}
            title="Gráficas y ganancias"
          >
            <BarChart3 size={16} />
            <span>Reportes</span>
          </button>
        </div>

        {/* Action pills & status */}
        <div className="nav-actions">
          <BackendStatusBanner
            isMockMode={isMockMode}
            isOnline={isBackendOnline}
            onToggleMockMode={onToggleMockMode}
            onRefresh={onRefreshBackend}
          />

          {/* Theme Toggle Button (Light / Dark "Medio Apagado") */}
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro (medio apagado)'}
            aria-label="Cambiar tema de color"
          >
            {theme === 'dark' ? <Sun size={17} color="#FDE047" /> : <Moon size={17} />}
          </button>

          <Button
            variant="secondary"
            icon={<ScanLine size={15} />}
            onClick={onOpenScanner}
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
          >
            Escanear Ticket
          </Button>

          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={onOpenNewExpense}
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            + Gasto
          </Button>
        </div>
      </nav>
    </header>
  );
};
