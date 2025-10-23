// server/routes/auth.js (ESM version)

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Helper: generate JWT token
function generateToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set in environment');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
}

// Input validation and sanitization functions
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Input validation
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate inputs
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3-20 characters' });
    }
    
    if (!validateUsername(sanitizedUsername)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
    }
    
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });
    if (password.length > 128) return res.status(400).json({ error: 'Password too long' });

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [sanitizedEmail, sanitizedUsername]
    );
    if (existingUsers.length > 0) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [sanitizedUsername, sanitizedEmail, passwordHash]
    );

    const token = generateToken({ userId: result.insertId, username: sanitizedUsername, email: sanitizedEmail });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: result.insertId, username: sanitizedUsername, email: sanitizedEmail, selectedGenres: [], uploads: [] }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Registration failed', message: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    
    // Sanitize email
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password length
    if (password.length < 1 || password.length > 128) {
      return res.status(400).json({ error: 'Invalid password length' });
    }

    const [users] = await pool.execute(
      'SELECT id, username, email, password_hash, role, selected_genres FROM users WHERE email = ?',
      [sanitizedEmail]
    );
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const [uploads] = await pool.execute(
      'SELECT id, title, image_url, likes_count, created_at FROM uploads WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    const token = generateToken({ userId: user.id, username: user.username, email: user.email, role: user.role });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        selectedGenres: user.selected_genres || [],
        uploads: uploads.map(u => ({
          id: u.id,
          title: u.title,
          imageUrl: u.image_url,
          likes: u.likes_count,
          createdAt: u.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: 'Internal server error' });
  }
});

// GET /api/auth/profile (Protected)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [uploads] = await pool.execute(
      'SELECT id, title, image_url, likes_count, created_at, character1_data, character2_data, genres FROM uploads WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({
      user: { ...req.user, uploads: uploads.map(u => ({
        id: u.id,
        title: u.title,
        imageUrl: u.image_url,
        likes: u.likes_count,
        createdAt: u.created_at,
        character1: u.character1_data,
        character2: u.character2_data,
        genres: u.genres
      })) }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', message: 'Internal server error' });
  }
});

// PUT /api/auth/genres (Protected)
router.put('/genres', authenticateToken, async (req, res) => {
  try {
    const { genres } = req.body;
    if (!Array.isArray(genres)) return res.status(400).json({ error: 'Genres must be an array' });

    await pool.execute('UPDATE users SET selected_genres = ? WHERE id = ?', [JSON.stringify(genres), req.user.id]);
    res.json({ message: 'Genres updated successfully', genres });
  } catch (error) {
    console.error('Genre update error:', error);
    res.status(500).json({ error: 'Failed to update genres', message: 'Internal server error' });
  }
});

export default router;
