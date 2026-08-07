import React, { useRef, useState, useEffect } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  DollarSign, 
  Download, 
  Upload, 
  Database, 
  CheckCircle2, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export const Settings = () => {
  const { 
    currency, 
    setCurrency, 
    theme, 
    setTheme, 
    exportToCSV, 
    exportJSONBackup, 
    restoreJSONBackup,
    showToast 
  } = useExpense();

  const [dbStatus, setDbStatus] = useState('Checking...');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setDbStatus(data.database || 'Local Store'))
      .catch(() => setDbStatus('Offline'));
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      restoreJSONBackup(event.target.result);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Panel */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SettingsIcon size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              Application Settings & Preferences
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Configure your display theme, preferred currency, and manage data backups.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* 1. Appearance & Theme Settings */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sun size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Appearance Theme
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Switch between Dark Mode and Light Mode interface themes.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              className={`btn-secondary ${theme === 'dark' ? 'active' : ''}`}
              style={{
                padding: '1rem',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '0.5rem',
                background: theme === 'dark' ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: theme === 'dark' ? '#ffffff' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)'
              }}
              onClick={() => setTheme('dark')}
            >
              <Moon size={22} />
              <span>Dark Theme</span>
            </button>

            <button
              className={`btn-secondary ${theme === 'light' ? 'active' : ''}`}
              style={{
                padding: '1rem',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '0.5rem',
                background: theme === 'light' ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: theme === 'light' ? '#ffffff' : 'var(--text-main)',
                border: '1px solid var(--border-subtle)'
              }}
              onClick={() => setTheme('light')}
            >
              <Sun size={22} />
              <span>Light Theme</span>
            </button>
          </div>
        </div>

        {/* 2. Currency Preferences */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="var(--accent-income)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Currency Formatting
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Select your primary currency symbol for display across all dashboards and reports.
          </p>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Select Active Currency
            </label>
            <select
              className="select-field"
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '0.95rem' }}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($) — US Dollar</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="CAD">CAD (CA$) — Canadian Dollar</option>
              <option value="AUD">AUD (A$) — Australian Dollar</option>
              <option value="JPY">JPY (¥) — Japanese Yen</option>
            </select>
          </div>
        </div>

        {/* 3. Data Backup & Restore */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={20} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Data Backup & Restore (Bonus Feature)
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Safeguard your data by exporting full JSON backups or CSV spreadsheets, or restore from a previous backup file.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {/* Export JSON */}
            <button className="btn-primary" onClick={exportJSONBackup} style={{ justifyContent: 'center' }}>
              <Download size={18} />
              <span>Export Full JSON Backup</span>
            </button>

            {/* Restore JSON */}
            <button 
              className="btn-secondary" 
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{ justifyContent: 'center' }}
            >
              <Upload size={18} />
              <span>Restore Backup (JSON)</span>
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleFileUpload} 
            />

            {/* Export CSV */}
            <button className="btn-secondary" onClick={exportToCSV} style={{ justifyContent: 'center' }}>
              <FileSpreadsheet size={18} />
              <span>Export CSV Log</span>
            </button>
          </div>

          {/* Database Health Badge */}
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.85rem 1rem', 
            background: 'var(--bg-glass)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <ShieldCheck size={18} color="var(--accent-income)" />
              <span style={{ color: 'var(--text-muted)' }}>Database Engine:</span>
              <strong style={{ color: 'var(--text-main)' }}>{dbStatus}</strong>
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--accent-income)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={14} /> Active & Synchronized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
