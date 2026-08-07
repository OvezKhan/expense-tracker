import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUpDown, 
  X, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard 
} from 'lucide-react';

export const TransactionList = () => {
  const { 
    transactions, 
    categories, 
    filters, 
    setFilters, 
    resetFilters, 
    deleteTransaction, 
    setEditingTransaction, 
    setIsQuickAddOpen, 
    exportToCSV, 
    formatCurrency,
    isLoading 
  } = useExpense();

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const selectedCatObj = categories.find(c => c.name === filters.category);
  const availableSubcats = selectedCatObj ? selectedCatObj.subcategories : [];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'category' ? { subcategory: 'all' } : {})
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search & Filter Toolbar */}
      <div className="glass-card toolbar-card">
        <div className="toolbar-main">
          {/* Search Box */}
          <div className="search-box">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="input-field"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Quick Type Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-glass)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
            {['all', 'income', 'expense'].map((t) => (
              <button
                key={t}
                className={`chip-btn ${filters.type === t ? 'selected' : ''}`}
                style={{ textTransform: 'capitalize', padding: '0.4rem 0.85rem' }}
                onClick={() => handleFilterChange('type', t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              className={`btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} />
              <span>Filter</span>
            </button>

            <button className="btn-secondary" onClick={exportToCSV} title="Export CSV">
              <Download size={16} />
              <span>Export</span>
            </button>

            <button className="btn-primary" onClick={() => setIsQuickAddOpen(true)}>
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '0.85rem', 
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            marginTop: '0.5rem'
          }}>
            {/* Category Filter */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Category
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Subcategory
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={filters.subcategory}
                onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                disabled={!selectedCatObj}
              >
                <option value="all">All Subcategories</option>
                {availableSubcats.map((sub, i) => (
                  <option key={i} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Payment Method
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={filters.paymentMethod}
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                From Date
              </label>
              <input
                type="date"
                className="input-field"
                style={{ padding: '0.55rem 0.5rem' }}
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                To Date
              </label>
              <input
                type="date"
                className="input-field"
                style={{ padding: '0.55rem 0.5rem' }}
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            {/* Min Amount */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Min Amount
              </label>
              <input
                type="number"
                className="input-field"
                style={{ padding: '0.55rem 0.75rem' }}
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              />
            </div>

            {/* Max Amount */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Max Amount
              </label>
              <input
                type="number"
                className="input-field"
                style={{ padding: '0.55rem 0.75rem' }}
                placeholder="10000"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              />
            </div>

            {/* Reset Filter Button */}
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                className="btn-secondary" 
                style={{ width: '100%', justifyContent: 'center', color: 'var(--accent-expense)' }}
                onClick={resetFilters}
              >
                <X size={16} /> Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Table & Responsive Cards Container */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{transactions.length}</strong> transactions
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sort:</span>
            <select
              className="select-field"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
            <button 
              className="btn-icon-only" 
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Toggle Sort Order (${filters.sortOrder})`}
            >
              <ArrowUpDown size={14} />
            </button>
          </div>
        </div>

        {/* Desktop & Tablet Table View */}
        <div className="table-responsive">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Type / Date</th>
                <th>Category & Subcategory</th>
                <th>Payment Method</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="tx-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className={tx.type === 'income' ? 'badge badge-income' : 'badge badge-expense'}>
                          {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {tx.type}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tx.date}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{tx.category}</div>
                      {tx.subcategory && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.subcategory}</div>
                      )}
                    </td>

                    <td>
                      <span className="badge badge-payment">
                        <CreditCard size={12} /> {tx.paymentMethod || 'Cash'}
                      </span>
                    </td>

                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {tx.notes || '—'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1rem', color: tx.type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)' }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}>
                        <button 
                          className="btn-icon-only" 
                          onClick={() => setEditingTransaction(tx)}
                          title="Edit Transaction"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="btn-icon-only" 
                          style={{ color: 'var(--accent-expense)' }}
                          onClick={() => {
                            if (window.confirm('Delete this transaction?')) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          title="Delete Transaction"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    No matching transactions found. Try adjusting your filters or add a new entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
