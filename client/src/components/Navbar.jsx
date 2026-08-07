import React from 'react';
import { useExpense } from '../context/ExpenseContext';
import { LayoutDashboard, ArrowRightLeft, FolderKanban, BarChart3, Settings, Plus, Wallet } from 'lucide-react';

export const Navbar = () => {
  const { activeTab, setActiveTab, setIsQuickAddOpen, stats, formatCurrency } = useExpense();

  return (
    <nav className="navbar glass-card">
      <a href="#" className="brand">
        <div className="brand-icon">
          <Wallet size={22} color="#ffffff" />
        </div>
        <span>SpendWise</span>
      </a>

      <div className="nav-links">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <ArrowRightLeft size={18} />
          <span>Transactions</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <FolderKanban size={18} />
          <span>Categories</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <BarChart3 size={18} />
          <span>Reports</span>
        </button>

        <button
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Balance</div>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: stats.currentBalance >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)' }}>
            {formatCurrency(stats.currentBalance)}
          </div>
        </div>

        <button className="btn-primary" onClick={() => setIsQuickAddOpen(true)}>
          <Plus size={18} />
          <span>Quick Entry</span>
        </button>
      </div>
    </nav>
  );
};
