import React, { useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { X, Check } from 'lucide-react';

export const TransactionModal = () => {
  const { editingTransaction, setEditingTransaction, categories, updateTransaction } = useExpense();

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type || 'expense');
      setAmount(editingTransaction.amount?.toString() || '');
      setCategory(editingTransaction.category || '');
      setSubcategory(editingTransaction.subcategory || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'Cash');
      setNotes(editingTransaction.notes || '');
      setDate(editingTransaction.date || '');
    }
  }, [editingTransaction]);

  if (!editingTransaction) return null;

  const availableCategories = categories.filter(c => c.type === type);
  const selectedCatObj = availableCategories.find(c => c.name === category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    await updateTransaction(editingTransaction.id, {
      amount: Number(amount),
      type,
      category,
      subcategory,
      paymentMethod,
      date,
      notes
    });

    setEditingTransaction(null);
  };

  return (
    <div className="sheet-overlay" onClick={() => setEditingTransaction(null)}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '1.75rem', margin: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Edit Transaction
          </h3>
          <button className="btn-icon-only" onClick={() => setEditingTransaction(null)}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Type
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Amount ($)
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Category
            </label>
            <select
              className="select-field"
              style={{ width: '100%' }}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
            >
              <option value="">Select Category</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCatObj && selectedCatObj.subcategories?.length > 0 && (
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Subcategory
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
              >
                <option value="">Select Subcategory (Optional)</option>
                {selectedCatObj.subcategories.map((sub, i) => (
                  <option key={i} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Payment Method
              </label>
              <select
                className="select-field"
                style={{ width: '100%' }}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Date
              </label>
              <input
                type="date"
                className="input-field"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Notes
            </label>
            <input
              type="text"
              className="input-field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setEditingTransaction(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
