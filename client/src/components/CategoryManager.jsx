import React, { useState } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { Plus, Trash2, Edit2, Check, Tag, FolderPlus, X } from 'lucide-react';

export const CategoryManager = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useExpense();

  const [activeTypeTab, setActiveTypeTab] = useState('expense');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);

  // New Category Form State
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#3b82f6');
  const [catSubcats, setCatSubcats] = useState('');

  // Add Subcategory quick input state
  const [newSubcatInput, setNewSubcatInput] = useState({});

  const filteredCategories = categories.filter(c => c.type === activeTypeTab);

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const subList = catSubcats
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    addCategory({
      name: catName.trim(),
      type: activeTypeTab,
      color: catColor,
      subcategories: subList
    });

    setCatName('');
    setCatSubcats('');
    setIsAddingCategory(false);
  };

  const handleAddSubcategory = (cat) => {
    const text = newSubcatInput[cat.id];
    if (!text || !text.trim()) return;

    const updatedSubcats = [...(cat.subcategories || []), text.trim()];
    updateCategory(cat.id, { subcategories: updatedSubcats });

    setNewSubcatInput(prev => ({ ...prev, [cat.id]: '' }));
  };

  const handleRemoveSubcategory = (cat, subIndex) => {
    const updatedSubcats = cat.subcategories.filter((_, idx) => idx !== subIndex);
    updateCategory(cat.id, { subcategories: updatedSubcats });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Category Type Toggle Tabs & Header */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Category Management
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage Income and Expense categories and nested subcategories for precise tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Income vs Expense Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '0.25rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`nav-btn ${activeTypeTab === 'expense' ? 'active' : ''}`}
              style={{ padding: '0.5rem 1.25rem' }}
              onClick={() => setActiveTypeTab('expense')}
            >
              Expense Categories
            </button>
            <button
              className={`nav-btn ${activeTypeTab === 'income' ? 'active' : ''}`}
              style={{ padding: '0.5rem 1.25rem' }}
              onClick={() => setActiveTypeTab('income')}
            >
              Income Categories
            </button>
          </div>

          <button className="btn-primary" onClick={() => setIsAddingCategory(true)}>
            <Plus size={16} /> New Category
          </button>
        </div>
      </div>

      {/* New Category Modal/Form Drawer */}
      {isAddingCategory && (
        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Create New {activeTypeTab === 'income' ? 'Income' : 'Expense'} Category
            </h3>
            <button className="btn-icon-only" onClick={() => setIsAddingCategory(false)}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Category Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Health & Fitness"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Theme Color
              </label>
              <input
                type="color"
                style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-md)', background: 'transparent', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Subcategories (Comma separated)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Gym, Supplements, Doctor Fees"
                value={catSubcats}
                onChange={(e) => setCatSubcats(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsAddingCategory(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Check size={16} /> Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: `${cat.color}22`,
                  border: `1px solid ${cat.color}55`,
                  color: cat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Tag size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {cat.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {cat.type} Category
                  </span>
                </div>
              </div>

              <button
                className="btn-icon-only"
                style={{ color: 'var(--accent-expense)' }}
                onClick={() => {
                  if (window.confirm(`Delete category "${cat.name}"?`)) {
                    deleteCategory(cat.id);
                  }
                }}
                title="Delete Category"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Subcategory List */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Subcategories ({cat.subcategories?.length || 0})
              </div>

              <div className="chip-group">
                {cat.subcategories && cat.subcategories.length > 0 ? (
                  cat.subcategories.map((sub, idx) => (
                    <span 
                      key={idx} 
                      className="chip-btn" 
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'default' }}
                    >
                      {sub}
                      <X 
                        size={12} 
                        style={{ cursor: 'pointer', opacity: 0.7 }} 
                        onClick={() => handleRemoveSubcategory(cat, idx)}
                        title="Remove Subcategory"
                      />
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No subcategories added.</span>
                )}
              </div>
            </div>

            {/* Add Subcategory Inline Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
              <input
                type="text"
                className="input-field"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                placeholder="Add subcategory..."
                value={newSubcatInput[cat.id] || ''}
                onChange={(e) => setNewSubcatInput({ ...newSubcatInput, [cat.id]: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubcategory(cat);
                }}
              />
              <button
                className="btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => handleAddSubcategory(cat)}
              >
                <FolderPlus size={14} /> Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
