import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import connectDB from './config/database.js';
import Companies from './models/Companies.js';
import Customers from './models/Customers.js';
import Packages from './models/Packages.js';

import apiRoutes from './routes/api.js';

import path from 'path';
import { fileURLToPath } from 'url'; // For __filename and __dirname equivalent


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB - add this before middleware
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Use API routes
app.use('/api', apiRoutes);

// Serve list.html on root route
app.get(['/', '/list'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'list.html'));
});

// Serve list page with company parameter
app.get('/list/:companyId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'packages.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
