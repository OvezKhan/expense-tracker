import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

// Fix for Windows / Serverless DNS SRV resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Explicit permissive CORS middleware for separate frontend/backend deployments
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());

app.use(express.json());

// Path to JSON persistence file
const dataPath = path.join(__dirname, 'data', 'db.json');

// Default Seed Categories
const DEFAULT_SEED_CATEGORIES = [
  { id: "cat-inc-1", name: "Salary", type: "income", icon: "Briefcase", color: "#10b981", subcategories: ["Primary Job", "Bonus", "Overtime"] },
  { id: "cat-inc-2", name: "Freelance & Consulting", type: "income", icon: "Laptop", color: "#06b6d4", subcategories: ["Web Design", "Development", "Mentorship"] },
  { id: "cat-inc-3", name: "Investments", type: "income", icon: "TrendingUp", color: "#8b5cf6", subcategories: ["Dividends", "Crypto", "Real Estate"] },
  { id: "cat-exp-1", name: "Food & Dining", type: "expense", icon: "Utensils", color: "#f43f5e", subcategories: ["Groceries", "Restaurants", "Coffee & Snacks", "Food Delivery"] },
  { id: "cat-exp-2", name: "Housing & Utilities", type: "expense", icon: "Home", color: "#3b82f6", subcategories: ["Rent/Mortgage", "Electricity", "Internet", "Water"] },
  { id: "cat-exp-3", name: "Transportation & Fuel", type: "expense", icon: "Car", color: "#f59e0b", subcategories: ["Fuel", "Public Transit", "Cab/Ride Hailing", "Vehicle Servicing"] },
  { id: "cat-exp-4", name: "Shopping & Lifestyle", type: "expense", icon: "ShoppingBag", color: "#ec4899", subcategories: ["Clothing", "Electronics", "Gifts", "Personal Care"] },
  { id: "cat-exp-5", name: "Entertainment & Subscriptions", type: "expense", icon: "Film", color: "#6366f1", subcategories: ["Streaming Services", "Gaming", "Concerts", "Books"] }
];

// In-memory data cache fallback
let dbData = {
  categories: DEFAULT_SEED_CATEGORIES,
  budget: { monthlyLimit: 3500 },
  transactions: []
};

// Mongoose Schemas
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

const budgetSchema = new mongoose.Schema({
  monthlyLimit: Number
});

const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const CategoryModel = mongoose.models.Category || mongoose.model('Category', categorySchema);
const BudgetModel = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

// Cached Mongoose Connection for Serverless & Standalone Functions
let cachedDbPromise = null;
const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (!MONGODB_URI) {
    return false;
  }
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  if (!cachedDbPromise) {
    cachedDbPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false
    }).then(async (m) => {
      console.log('🍃 MongoDB Atlas Connected!');
      const catCount = await CategoryModel.countDocuments();
      if (catCount === 0) {
        await CategoryModel.insertMany(DEFAULT_SEED_CATEGORIES);
        console.log('🌱 Seeded default categories into MongoDB!');
      }
      return m;
    }).catch(err => {
      console.error('❌ MongoDB Connection error:', err.message);
      cachedDbPromise = null;
      return false;
    });
  }
  await cachedDbPromise;
  return mongoose.connection.readyState === 1;
}

// Middleware to ensure DB connection on every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB Middleware Connection error:', err);
  }
  next();
});

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
  if (mongoose.connection.readyState === 1) return;
  try {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(dbData, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not persist db.json file system:', err.message);
  }
}

// Load JSON data on start
loadJsonData();

// Health Check
app.get('/api/health', (req, res) => {
  const isMongo = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: isMongo ? 'MongoDB Atlas (Live Connected)' : 'Local Persistent Storage',
    message: 'SpendWise REST API Server running smoothly 🚀'
  });
});

// GET Categories
app.get('/api/categories', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    let cats = await CategoryModel.find().lean();
    if (cats.length === 0) {
      cats = await CategoryModel.insertMany(DEFAULT_SEED_CATEGORIES);
    }
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

  if (mongoose.connection.readyState === 1) {
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

  if (mongoose.connection.readyState === 1) {
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

  if (mongoose.connection.readyState === 1) {
    await CategoryModel.deleteOne({ id });
    return res.json({ message: 'Category deleted' });
  }

  dbData.categories = dbData.categories.filter(c => c.id !== id);
  saveJsonData();
  res.json({ message: 'Category deleted' });
});

// GET Budget
app.get('/api/budget', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const b = await BudgetModel.findOne().lean();
    return res.json(b || { monthlyLimit: 3500 });
  }
  res.json(dbData.budget || { monthlyLimit: 3500 });
});

// PUT Budget
app.put('/api/budget', async (req, res) => {
  const { monthlyLimit } = req.body;
  if (typeof monthlyLimit === 'number' && monthlyLimit >= 0) {
    if (mongoose.connection.readyState === 1) {
      const b = await BudgetModel.findOneAndUpdate({}, { monthlyLimit }, { upsert: true, new: true });
      return res.json(b);
    }
    dbData.budget.monthlyLimit = monthlyLimit;
    saveJsonData();
  }
  res.json(dbData.budget);
});

// GET Transactions (Search, Multi-filter, Sort)
app.get('/api/transactions', async (req, res) => {
  let list = [];

  if (mongoose.connection.readyState === 1) {
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

  const catName = category.trim();

  // Ensure category exists in DB so it never vanishes
  if (mongoose.connection.readyState === 1) {
    const existingCat = await CategoryModel.findOne({ name: catName, type: type.toLowerCase() });
    if (!existingCat) {
      await CategoryModel.create({
        id: `cat-${Date.now()}`,
        name: catName,
        type: type.toLowerCase(),
        icon: type.toLowerCase() === 'income' ? 'TrendingUp' : 'Tag',
        color: type.toLowerCase() === 'income' ? '#10b981' : '#f43f5e',
        subcategories: subcategory ? [subcategory.trim()] : []
      });
    }
  } else {
    const existingCat = dbData.categories.find(c => c.name.toLowerCase() === catName.toLowerCase() && c.type === type.toLowerCase());
    if (!existingCat) {
      dbData.categories.push({
        id: `cat-${Date.now()}`,
        name: catName,
        type: type.toLowerCase(),
        icon: type.toLowerCase() === 'income' ? 'TrendingUp' : 'Tag',
        color: type.toLowerCase() === 'income' ? '#10b981' : '#f43f5e',
        subcategories: subcategory ? [subcategory.trim()] : []
      });
    }
  }

  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    amount: parseFloat(Number(amount).toFixed(2)),
    type: type.toLowerCase(),
    category: catName,
    subcategory: subcategory ? subcategory.trim() : '',
    date: date || new Date().toISOString().split('T')[0],
    notes: notes ? notes.trim() : '',
    paymentMethod: paymentMethod || 'Cash'
  };

  if (mongoose.connection.readyState === 1) {
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

  if (mongoose.connection.readyState === 1) {
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

  if (mongoose.connection.readyState === 1) {
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
  let budgetObj = { monthlyLimit: 3500 };

  if (mongoose.connection.readyState === 1) {
    transactions = await TransactionModel.find().lean();
    const b = await BudgetModel.findOne().lean();
    if (b) budgetObj = b;
  } else {
    transactions = dbData.transactions || [];
    budgetObj = dbData.budget || { monthlyLimit: 3500 };
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
  const monthlyBudget = budgetObj.monthlyLimit || 3500;
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
  if (mongoose.connection.readyState === 1) {
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

// Export Express app for Vercel Serverless Functions
export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 SpendWise Express Server running on http://localhost:${PORT}`);
  });
}
