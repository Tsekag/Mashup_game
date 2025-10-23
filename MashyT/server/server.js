// server/server.js (ESM version)
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: '../.env' });

// Set JWT_SECRET if not loaded from .env
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'mashup-game-super-secret-jwt-key-2024-admin-panel';
  console.log('⚠️  JWT_SECRET set manually');
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import { testConnection, initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/uploads.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';   // ✅ genres + characters API

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', userRoutes);  // ✅ exposes /api/genres and /api/characters

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Mashup Game API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.all(/.*/, (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
async function startServer() {
  try {
    await testConnection();
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
