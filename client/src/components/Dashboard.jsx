import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit2, 
  Plus, 
  Check, 
  Layers 
} from 'lucide-react';

export const Dashboard = () => {
  const { stats, updateBudget, setActiveTab, setIsQuickAddOpen, setEditingTransaction, formatCurrency } = useExpense();
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(stats.monthlyBudget || 3500);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    updateBudget(newBudget);
    setIsEditingBudget(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Core Financial Metric Cards */}
      <div className="metrics-grid">
        {/* Balance */}
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Current Balance</span>
            <div className="metric-icon-wrap balance">
              <Wallet size={22} />
            </div>
          </div>
          <div className="metric-value" style={{ color: stats.currentBalance >= 0 ? 'var(--text-main)' : 'var(--accent-expense)' }}>
            {formatCurrency(stats.currentBalance)}
          </div>
          <div className="metric-footer">
            <span>Net position across all accounts</span>
          </div>
        </div>

        {/* Total Income */}
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Income</span>
            <div className="metric-icon-wrap income">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-income)' }}>
            {formatCurrency(stats.totalIncome)}
          </div>
          <div className="metric-footer" style={{ color: 'var(--accent-income)' }}>
            <ArrowUpRight size={16} />
            <span>Lifetime Total Earnings</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Expenses</span>
            <div className="metric-icon-wrap expense">
              <TrendingDown size={22} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-expense)' }}>
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div className="metric-footer" style={{ color: 'var(--accent-expense)' }}>
            <ArrowDownRight size={16} />
            <span>Lifetime Outflow</span>
          </div>
        </div>

        {/* Savings */}
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Net Savings</span>
            <div className="metric-icon-wrap savings">
              <PiggyBank size={22} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
            {formatCurrency(stats.totalSavings)}
          </div>
          <div className="metric-footer">
            <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>
              {stats.savingsRate}%
            </span>
            <span>savings rate</span>
          </div>
        </div>
      </div>

      {/* 2. Monthly Spending Progress Bar */}
      <div className="glass-card progress-container">
        <div className="progress-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Monthly Spending Progress
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Spent <strong>{formatCurrency(stats.monthlyExpenses)}</strong> of <strong>{formatCurrency(stats.monthlyBudget)}</strong> target limit
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isEditingBudget ? (
              <form onSubmit={handleSaveBudget} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  className="input-field"
                  style={{ width: '110px', padding: '0.4rem 0.6rem' }}
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  placeholder="Target Amount"
                  autoFocus
                />
                <button type="submit" className="btn-icon-only" style={{ background: 'var(--accent-income)', color: '#fff' }}>
                  <Check size={16} />
                </button>
              </form>
            ) : (
              <button 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => { setNewBudget(stats.monthlyBudget); setIsEditingBudget(true); }}
              >
                <Edit2 size={14} />
                <span>Adjust Budget Target</span>
              </button>
            )}
          </div>
        </div>

        <div className="progress-track" style={{ marginTop: '0.75rem' }}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(stats.monthlyProgress || 0, 100)}%`,
              background: stats.monthlyProgress > 90 
                ? 'linear-gradient(90deg, #f43f5e, #e11d48)' 
                : stats.monthlyProgress > 75 
                ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' 
                : 'linear-gradient(90deg, #10b981, #06b6d4)'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>0%</span>
          <span>{stats.monthlyProgress}% Budget Used</span>
          <span>100%</span>
        </div>
      </div>

      {/* 3. Recent Transactions & Category Breakdown Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Transactions Panel */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Recent Transactions
            </h3>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => setActiveTab('transactions')}
            >
              View All
            </button>
          </div>

          {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-glass)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      background: tx.type === 'income' ? 'var(--accent-income-glow)' : 'var(--accent-expense-glow)',
                      color: tx.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>

                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {tx.category} {tx.subcategory ? `• ${tx.subcategory}` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {tx.date} • {tx.paymentMethod || 'Cash'} {tx.notes ? `(${tx.notes})` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontWeight: '800',
                    fontSize: '1rem',
                    color: tx.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)'
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <p>No recent transactions available.</p>
              <button 
                className="btn-primary" 
                style={{ marginTop: '1rem' }}
                onClick={() => setIsQuickAddOpen(true)}
              >
                <Plus size={16} /> Add First Entry
              </button>
            </div>
          )}
        </div>

        {/* Top Expense Categories Breakdown */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Top Expenses by Category
            </h3>
            <button 
              className="btn-secondary" 
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              onClick={() => setActiveTab('reports')}
            >
              Full Analytics
            </button>
          </div>

          {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.categoryBreakdown.slice(0, 5).map((item, idx) => {
                const totalExp = stats.totalExpenses || 1;
                const pct = Math.round((item.amount / totalExp) * 100);

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{item.name}</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>
                        {formatCurrency(item.amount)} ({pct}%)
                      </span>
                    </div>
                    <div className="progress-track" style={{ height: '8px' }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: `hsl(${(idx * 65 + 340) % 360}, 85%, 60%)`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Layers size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p>No expense category distribution yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
