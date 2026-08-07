import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Force Node.js to use Google & Cloudflare Public DNS to bypass local ISP SRV resolution blocks (ECONNREFUSED)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignored if unsupported
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Path to JSON persistence file
const dataPath = path.join(__dirname, 'data', 'db.json');

// Global DB data cache
let dbData = {
  categories: [],
  budget: { monthlyLimit: 3500 },
  transactions: []
};

// Check if MongoDB URI is provided
const MONGODB_URI = process.env.MONGODB_URI;
let isMongoConnected = false;

// Mongoose Schemas & Models (if MongoDB URI is used)
const transactionSchema = new mongoose.Schema({
  id: String,
  amount: Number,
  type: String,
  category: String,
  subcategory: String,
  date: String,
  notes: String,
  paymentMethod: String
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  id: String,
  name: String,
  type: String,
  icon: String,
  color: String,
  subcategories: [String]
});

const TransactionModel = mongoose.model('Transaction', transactionSchema);
const CategoryModel = mongoose.model('Category', categorySchema);

// Connect to MongoDB if URI provided, else load db.json
async function initDatabase() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 6000
      });
      isMongoConnected = true;
      console.log('🍃 Successfully connected to MongoDB Atlas database!');
    } catch (err) {
      console.error('❌ MongoDB Connection failed, falling back to local db.json:', err.message);
      loadJsonData();
    }
  } else {
    console.log('ℹ️ No MONGODB_URI provided. Using local JSON database (server/data/db.json)');
    loadJsonData();
  }
}

function loadJsonData() {
  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      dbData = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read db.json:', err.message);
  }
}

function saveJsonData() {
  if (isMongoConnected) return;
  try {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not persist db.json file system:', err.message);
  }
}

// Initialize Database on Start
initDatabase();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isMongoConnected ? 'MongoDB Atlas' : 'Local db.json Store',
    message: 'SpendWise REST API Server running smoothly 🚀'
  });
});

// GET Categories
app.get('/api/categories', async (req, res) => {
  if (isMongoConnected) {
    const cats = await CategoryModel.find().lean();
    return res.json(cats);
  }
  res.json(dbData.categories || []);
});

// POST Category
app.post('/api/categories', async (req, res) => {
  const { name, type, icon, color, subcategories } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Category name and type are required' });

  const newCategory = {
    id: `cat-${Date.now()}`,
    name: name.trim(),
    type: type.toLowerCase(),
    icon: icon || (type === 'income' ? 'TrendingUp' : 'Tag'),
    color: color || (type === 'income' ? '#10b981' : '#f43f5e'),
    subcategories: Array.isArray(subcategories) ? subcategories : []
  };

  if (isMongoConnected) {
    const created = await CategoryModel.create(newCategory);
    return res.status(201).json(created);
  }

  dbData.categories.push(newCategory);
  saveJsonData();
  res.status(201).json(newCategory);
});

// PUT Category
app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;

  if (isMongoConnected) {
    const updated = await CategoryModel.findOneAndUpdate({ id }, req.body, { new: true });
    return res.json(updated);
  }

  const index = dbData.categories.findIndex(c => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  dbData.categories[index] = { ...dbData.categories[index], ...req.body, id };
  saveJsonData();
  res.json(dbData.categories[index]);
});

// DELETE Category
app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;

  if (isMongoConnected) {
    await CategoryModel.deleteOne({ id });
    return res.json({ message: 'Category deleted' });
  }

  dbData.categories = dbData.categories.filter(c => c.id !== id);
  saveJsonData();
  res.json({ message: 'Category deleted' });
});

// GET Budget
app.get('/api/budget', (req, res) => {
  res.json(dbData.budget || { monthlyLimit: 3500 });
});

// PUT Budget
app.put('/api/budget', (req, res) => {
  const { monthlyLimit } = req.body;
  if (typeof monthlyLimit === 'number' && monthlyLimit >= 0) {
    dbData.budget.monthlyLimit = monthlyLimit;
    saveJsonData();
  }
  res.json(dbData.budget);
});

// GET Transactions (Search, Multi-filter, Sort)
app.get('/api/transactions', async (req, res) => {
  let list = [];

  if (isMongoConnected) {
    list = await TransactionModel.find().lean();
  } else {
    list = [...(dbData.transactions || [])];
  }

  const { search, type, category, subcategory, paymentMethod, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder } = req.query;

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    list = list.filter(t => 
      (t.notes && t.notes.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.subcategory && t.subcategory.toLowerCase().includes(q)) ||
      (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q))
    );
  }

  if (type && type !== 'all') list = list.filter(t => t.type === type.toLowerCase());
  if (category && category !== 'all') list = list.filter(t => t.category === category);
  if (subcategory && subcategory !== 'all') list = list.filter(t => t.subcategory === subcategory);
  if (paymentMethod && paymentMethod !== 'all') list = list.filter(t => t.paymentMethod === paymentMethod);

  if (startDate) list = list.filter(t => new Date(t.date) >= new Date(startDate));
  if (endDate) list = list.filter(t => new Date(t.date) <= new Date(endDate + 'T23:59:59'));

  if (minAmount && !isNaN(parseFloat(minAmount))) list = list.filter(t => Number(t.amount) >= parseFloat(minAmount));
  if (maxAmount && !isNaN(parseFloat(maxAmount))) list = list.filter(t => Number(t.amount) <= parseFloat(maxAmount));

  const key = sortBy || 'date';
  const order = sortOrder === 'asc' ? 1 : -1;
  list.sort((a, b) => {
    if (key === 'amount') return (a.amount - b.amount) * order;
    if (key === 'date') return (new Date(a.date) - new Date(b.date)) * order;
    return String(a[key] || '').localeCompare(String(b[key] || '')) * order;
  });

  res.json(list);
});

// POST Transaction
app.post('/api/transactions', async (req, res) => {
  const { amount, type, category, subcategory, date, notes, paymentMethod } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'Valid positive amount is required' });
  if (!type || !['income', 'expense'].includes(type.toLowerCase())) return res.status(400).json({ error: 'Type must be income or expense' });
  if (!category) return res.status(400).json({ error: 'Category is required' });

  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    amount: parseFloat(Number(amount).toFixed(2)),
    type: type.toLowerCase(),
    category: category.trim(),
    subcategory: subcategory ? subcategory.trim() : '',
    date: date || new Date().toISOString().split('T')[0],
    notes: notes ? notes.trim() : '',
    paymentMethod: paymentMethod || 'Cash'
  };

  if (isMongoConnected) {
    const created = await TransactionModel.create(newTx);
    return res.status(201).json(created);
  }

  dbData.transactions.unshift(newTx);
  saveJsonData();
  res.status(201).json(newTx);
});

// PUT Transaction
app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;

  if (isMongoConnected) {
    const updated = await TransactionModel.findOneAndUpdate({ id }, req.body, { new: true });
    return res.json(updated);
  }

  const index = dbData.transactions.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Transaction not found' });

  dbData.transactions[index] = {
    ...dbData.transactions[index],
    ...req.body,
    amount: req.body.amount ? parseFloat(Number(req.body.amount).toFixed(2)) : dbData.transactions[index].amount,
    id
  };
  saveJsonData();
  res.json(dbData.transactions[index]);
});

// DELETE Transaction
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;

  if (isMongoConnected) {
    await TransactionModel.deleteOne({ id });
    return res.json({ message: 'Transaction deleted' });
  }

  dbData.transactions = dbData.transactions.filter(t => t.id !== id);
  saveJsonData();
  res.json({ message: 'Transaction deleted' });
});

// GET Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  let transactions = [];
  if (isMongoConnected) {
    transactions = await TransactionModel.find().lean();
  } else {
    transactions = dbData.transactions || [];
  }

  let totalIncome = 0;
  let totalExpenses = 0;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  transactions.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
      if (t.date && t.date.startsWith(currentMonthStr)) monthlyIncome += amt;
    } else if (t.type === 'expense') {
      totalExpenses += amt;
      if (t.date && t.date.startsWith(currentMonthStr)) monthlyExpenses += amt;
    }
  });

  const currentBalance = totalIncome - totalExpenses;
  const totalSavings = currentBalance > 0 ? currentBalance : 0;
  const monthlyBudget = dbData.budget?.monthlyLimit || 3500;
  const monthlyProgress = Math.min(Math.round((monthlyExpenses / monthlyBudget) * 100), 100);

  const categoryMap = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
    });

  const categoryBreakdown = Object.keys(categoryMap).map(cat => ({
    name: cat,
    amount: categoryMap[cat]
  })).sort((a, b) => b.amount - a.amount);

  res.json({
    currentBalance,
    totalIncome,
    totalExpenses,
    totalSavings,
    savingsRate: totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0,
    monthlyIncome,
    monthlyExpenses,
    monthlyBudget,
    monthlyProgress,
    recentTransactions: transactions.slice(0, 6),
    categoryBreakdown
  });
});

// GET Reports
app.get('/api/reports/monthly', async (req, res) => {
  let transactions = [];
  if (isMongoConnected) {
    transactions = await TransactionModel.find().lean();
  } else {
    transactions = dbData.transactions || [];
  }

  const monthlyGroup = {};

  transactions.forEach(t => {
    if (!t.date) return;
    const dateObj = new Date(t.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyGroup[monthKey]) {
      monthlyGroup[monthKey] = {
        month: monthKey,
        label: dateObj.toLocaleString('default', { month: 'short', year: 'numeric' }),
        income: 0,
        expense: 0,
        savings: 0
      };
    }

    const amt = Number(t.amount) || 0;
    if (t.type === 'income') monthlyGroup[monthKey].income += amt;
    else if (t.type === 'expense') monthlyGroup[monthKey].expense += amt;
  });

  const reportData = Object.values(monthlyGroup)
    .map(item => ({
      ...item,
      savings: Math.max(0, item.income - item.expense)
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  res.json(reportData);
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 SpendWise Express Server running on http://localhost:${PORT}`);
});
