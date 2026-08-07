import React from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { CategoryManager } from './components/CategoryManager';
import { Reports } from './components/Reports';
import { QuickAddSheet } from './components/QuickAddSheet';
import { TransactionModal } from './components/TransactionModal';

function MainContent() {
  const { activeTab, notification } = useExpense();

  return (
    <div className="app-container">
      {/* Toast Notification Banner */}
      {notification && (
        <div 
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 1000,
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: notification.type === 'error' ? 'var(--accent-expense)' : 'var(--accent-primary)',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            fontWeight: '600',
            fontSize: '0.875rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Navigation Header */}
      <Navbar />

      {/* Dynamic View rendering based on active navigation tab */}
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'transactions' && <TransactionList />}
      {activeTab === 'categories' && <CategoryManager />}
      {activeTab === 'reports' && <Reports />}

      {/* Floating Action Button & Bottom Sheet Entry */}
      <QuickAddSheet />

      {/* Transaction Edit Modal */}
      <TransactionModal />
    </div>
  );
}

export default function App() {
  return (
    <ExpenseProvider>
      <MainContent />
    </ExpenseProvider>
  );
}
