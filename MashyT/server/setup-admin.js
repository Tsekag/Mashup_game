// server/setup-admin.js - Script to create admin user

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './config/database.js';

dotenv.config();

async function createAdminUser() {
  try {
    console.log('🔧 Setting up admin user...');
    
    // Check if admin user already exists
    const [existingAdmin] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR role = ?',
      ['admin@mashupgame.com', 'admin']
    );
    
    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Create admin user
    const adminEmail = 'admin@mashupgame.com';
    const adminPassword = 'admin123';
    const adminUsername = 'admin';
    
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [adminUsername, adminEmail, passwordHash, 'admin']
    );
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Please change the password after first login');
    
    // Add some sample genres
    console.log('🎭 Adding sample genres...');
    const sampleGenres = [
      'ADVENTURE',
      'FANTASY', 
      'HORROR',
      'MYSTERY',
      'ROMANCE',
      'SCI-FI'
    ];
    
    for (const genreName of sampleGenres) {
      try {
        await pool.execute(
          'INSERT INTO genres (name) VALUES (?)',
          [genreName]
        );
        console.log(`  ✅ Added genre: ${genreName}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`  ⚠️  Genre already exists: ${genreName}`);
        } else {
          console.error(`  ❌ Error adding genre ${genreName}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Setup completed successfully!');
    console.log('🚀 You can now access the admin panel at: http://localhost:5173/admin/login');
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();

