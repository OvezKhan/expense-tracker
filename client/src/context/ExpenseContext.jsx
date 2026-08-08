import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ExpenseContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || '';

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥'
};

export const ExpenseProvider = ({ children }) => {
  // Navigation tab ('dashboard', 'transactions', 'categories', 'reports', 'settings')
  const [activeTab, setActiveTab] = useState('dashboard');

  // Settings State
  const [currency, setCurrency] = useState(() => localStorage.getItem('spendwise_currency') || 'USD');
  const [theme, setTheme] = useState(() => localStorage.getItem('spendwise_theme') || 'dark');

  // Core Data States
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    currentBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    savingsRate: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyBudget: 3500,
    monthlyProgress: 0,
    recentTransactions: [],
    categoryBreakdown: []
  });

  // Search & Filter State
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    subcategory: 'all',
    paymentMethod: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // UI Modal & Bottom Sheet States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sync theme to document body
  useEffect(() => {
    localStorage.setItem('spendwise_theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync currency preference
  useEffect(() => {
    localStorage.setItem('spendwise_currency', currency);
  }, [currency]);

  // Currency Formatter Helper
  const formatCurrency = useCallback((amt) => {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    const num = Number(amt || 0);
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency]);

  // Toast Notification alert
  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch Dashboard Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Fetch Transactions with active filters
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val && val !== 'all') {
          params.append(key, val);
        }
      });

      const res = await fetch(`${API_BASE}/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial Load
  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  // Refetch transactions whenever filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Add Transaction
  const addTransaction = async (txData) => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create transaction');
      }

      const created = await res.json();
      showToast('Transaction added successfully! ✨');
      fetchTransactions();
      fetchStats();
      return created;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // Update Transaction
  const updateTransaction = async (id, txData) => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update transaction');
      }

      showToast('Transaction updated!');
      fetchTransactions();
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete transaction');

      showToast('Transaction deleted');
      fetchTransactions();
      fetchStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Add Category
  const addCategory = async (catData) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });

      if (!res.ok) throw new Error('Failed to add category');

      showToast('Category created!');
      fetchCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Update Category
  const updateCategory = async (id, catData) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });

      if (!res.ok) throw new Error('Failed to update category');

      showToast('Category updated!');
      fetchCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Category
  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete category');

      showToast('Category deleted');
      fetchCategories();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Update Budget Limit
  const updateBudget = async (newLimit) => {
    try {
      const res = await fetch(`${API_BASE}/api/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyLimit: Number(newLimit) })
      });
      if (res.ok) {
        showToast('Monthly budget target updated!');
        fetchStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Filters
  const resetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      subcategory: 'all',
      paymentMethod: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  // CSV Export Utility
  const exportToCSV = () => {
    if (transactions.length === 0) {
      showToast('No transactions to export', 'error');
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Amount', 'Category', 'Subcategory', 'Payment Method', 'Notes'];
    const csvRows = [headers.join(',')];

    transactions.forEach(t => {
      const row = [
        t.id,
        t.date,
        t.type,
        t.amount,
        `"${t.category || ''}"`,
        `"${t.subcategory || ''}"`,
        `"${t.paymentMethod || ''}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `SpendWise_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('CSV export downloaded! 📊');
  };

  // Export Full JSON Backup
  const exportJSONBackup = () => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency,
      theme,
      categories,
      transactions,
      budget: stats.monthlyBudget
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `SpendWise_Backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showToast('Full JSON backup exported! 💾');
  };

  // Restore JSON Backup
  const restoreJSONBackup = (jsonText) => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        throw new Error('Invalid backup file format');
      }

      parsed.transactions.forEach(async (tx) => {
        await addTransaction(tx);
      });

      showToast('Backup restored successfully! ⚡');
    } catch (err) {
      showToast('Failed to restore backup: ' + err.message, 'error');
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currency,
        setCurrency,
        theme,
        setTheme,
        formatCurrency,
        transactions,
        categories,
        stats,
        filters,
        setFilters,
        resetFilters,
        isQuickAddOpen,
        setIsQuickAddOpen,
        editingTransaction,
        setEditingTransaction,
        isLoading,
        notification,
        showToast,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        updateBudget,
        exportToCSV,
        exportJSONBackup,
        restoreJSONBackup,
        refetchAll: () => {
          fetchCategories();
          fetchStats();
          fetchTransactions();
        }
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => useContext(ExpenseContext);
