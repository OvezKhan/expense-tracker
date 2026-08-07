import React, { useState, useEffect, useRef } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Plus, X, Zap, ArrowUpRight, ArrowDownRight, Check, Calendar, CreditCard, Tag } from 'lucide-react';

export const QuickAddSheet = () => {
  const { isQuickAddOpen, setIsQuickAddOpen, categories, addTransaction, showToast } = useExpense();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const amountInputRef = useRef(null);

  // Available categories based on selected type
  const availableCategories = categories.filter(c => c.type === type);
  const selectedCatObj = availableCategories.find(c => c.name === category);

  // Keyboard shortcut listener ('N' or 'Escape')
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'n' || e.key === 'N') && !isQuickAddOpen && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      } else if (e.key === 'Escape' && isQuickAddOpen) {
        setIsQuickAddOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickAddOpen, setIsQuickAddOpen]);

  // Focus amount input when opened & set default category
  useEffect(() => {
    if (isQuickAddOpen) {
      setTimeout(() => {
        if (amountInputRef.current) amountInputRef.current.focus();
      }, 100);

      if (availableCategories.length > 0 && !category) {
        setCategory(availableCategories[0].name);
      }
    }
  }, [isQuickAddOpen, type]);

  if (!isQuickAddOpen) {
    return (
      <button 
        className="fab-btn" 
        onClick={() => setIsQuickAddOpen(true)}
        title="Quick Add Expense (Press 'N')"
      >
        <Plus size={28} />
      </button>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!category) {
      showToast('Please select a category', 'error');
      return;
    }

    try {
      await addTransaction({
        amount: Number(amount),
        type,
        category,
        subcategory,
        paymentMethod,
        date,
        notes
      });

      // Fast Reset for next entry
      setAmount('');
      setNotes('');
      setIsQuickAddOpen(false);
    } catch (err) {
      // Error handled by context toast
    }
  };

  return (
    <div className="sheet-overlay" onClick={() => setIsQuickAddOpen(false)}>
      <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Express Quick Entry
            </h3>
          </div>
          <button className="btn-icon-only" onClick={() => setIsQuickAddOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Income vs Expense Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className={`nav-btn ${type === 'expense' ? 'active' : ''}`}
              style={{ justifyContent: 'center', background: type === 'expense' ? 'var(--accent-expense)' : 'transparent' }}
              onClick={() => { setType('expense'); setCategory(''); setSubcategory(''); }}
            >
              <ArrowDownRight size={16} /> Expense
            </button>
            <button
              type="button"
              className={`nav-btn ${type === 'income' ? 'active' : ''}`}
              style={{ justifyContent: 'center', background: type === 'income' ? 'var(--accent-income)' : 'transparent' }}
              onClick={() => { setType('income'); setCategory(''); setSubcategory(''); }}
            >
              <ArrowUpRight size={16} /> Income
            </button>
          </div>

          {/* Large Amount Input */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              AMOUNT ($)
            </label>
            <input
              ref={amountInputRef}
              type="number"
              step="any"
              className="input-field"
              style={{ fontSize: '1.8rem', fontWeight: '800', padding: '0.75rem 1rem', textAlign: 'center', color: type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)' }}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Fast Smart Amount Chips */}
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.35rem', fontWeight: '600' }}>
              QUICK AMOUNTS:
            </div>
            <div className="chip-group" style={{ marginBottom: 0 }}>
              {[10, 25, 50, 100, 250, 500].map((quickAmt) => (
                <button
                  key={quickAmt}
                  type="button"
                  className={`chip-btn ${Number(amount) === quickAmt ? 'selected' : ''}`}
                  onClick={() => setAmount(quickAmt.toString())}
                >
                  ${quickAmt}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips Selection */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              CATEGORY
            </label>
            <div className="chip-group" style={{ marginBottom: 0 }}>
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`chip-btn ${category === cat.name ? 'selected' : ''}`}
                  onClick={() => {
                    setCategory(cat.name);
                    setSubcategory('');
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory dropdown if available */}
          {selectedCatObj && selectedCatObj.subcategories?.length > 0 && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                SUBCATEGORY
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
              >
                <option value="">Select Subcategory (Optional)</option>
                {selectedCatObj.subcategories.map((sub, idx) => (
                  <option key={idx} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method & Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                PAYMENT METHOD
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                DATE
              </label>
              <input
                type="date"
                className="input-field"
                style={{ padding: '0.55rem 0.75rem' }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              NOTES (OPTIONAL)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Lunch with team, Groceries refill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            <Check size={20} /> Save Entry Instantly
          </button>
        </form>
      </div>
    </div>
  );
};
