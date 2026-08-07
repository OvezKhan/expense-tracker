import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, PiggyBank, Printer } from 'lucide-react';

export const Reports = () => {
  const { stats, exportToCSV, formatCurrency } = useExpense();
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlyReport = async () => {
      try {
        const res = await fetch('/api/reports/monthly');
        if (res.ok) {
          const data = await res.json();
          setMonthlyTrendData(data);
        }
      } catch (err) {
        console.error('Error fetching monthly report:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMonthlyReport();
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6', '#3b82f6'];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Export Controls */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Financial Reports & Analytics
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Monthly trends, income vs expense breakdowns, and category distributions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn-primary" onClick={exportToCSV}>
            Export Full Log (CSV)
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Monthly Income</span>
            <div className="metric-icon-wrap income">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-income)' }}>
            {formatCurrency(stats.monthlyIncome)}
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Monthly Expenses</span>
            <div className="metric-icon-wrap expense">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-expense)' }}>
            {formatCurrency(stats.monthlyExpenses)}
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Net Savings</span>
            <div className="metric-icon-wrap savings">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
            {formatCurrency(Math.max(0, stats.monthlyIncome - stats.monthlyExpenses))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Monthly Trend Bar Chart */}
        <div className="glass-card" style={{ padding: '1.5rem', minHeight: '360px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem' }}>
            Monthly Cashflow Comparison
          </h3>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)' }}
                  formatter={(val) => formatCurrency(val)}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No historical monthly cashflow data available yet.
            </div>
          )}
        </div>

        {/* Expense Category Donut / Pie Chart */}
        <div className="glass-card" style={{ padding: '1.5rem', minHeight: '360px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem' }}>
            Expense Distribution by Category
          </h3>
          {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {stats.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-main)' }}
                  formatter={(val) => formatCurrency(val)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              No expense breakdown data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
