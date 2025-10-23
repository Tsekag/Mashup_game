# Mashup Game Website

A full-stack React application with Node.js backend that demonstrates comprehensive React hooks usage in a real-world scenario.

## 🎮 Features

- **JWT Authentication**: Secure login/signup with token-based auth
- **Genre Selection**: Choose 3-6 genres for character mashups
- **Spinning Wheel**: Animated wheel that selects random characters
- **3D Card Display**: Interactive 3D cards showing selected characters
- **File Upload**: Upload mashup artwork to your profile
- **Community Gallery**: Browse, like, and comment on community creations
- **User Dashboard**: View personal stats and uploaded artwork

## 🔧 Tech Stack

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Custom hooks and Context API for state management

**Backend:**
- Node.js with Express
- MySQL database (XAMPP)
- JWT authentication
- Multer for file uploads
- bcryptjs for password hashing

## 🚀 Getting Started

### Prerequisites

1. **XAMPP**: Install and start MySQL service
2. **Node.js**: Version 16 or higher

### Database Setup

1. Start XAMPP and ensure MySQL is running
2. Create a database named `mashup_game`
3. The application will automatically create the required tables

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mashup_game
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
```

3. Start both frontend and backend:
```bash
npm run dev:full
```

Or run them separately:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend  
npm run dev
```

## 📊 React Hooks Usage

This project demonstrates how different React hooks work together:

### 🔐 Authentication Flow
- **useContext**: Global auth state management
- **useState**: Form inputs, loading states
- **useEffect**: Token validation, localStorage sync

### 🎯 Genre Selection
- **useState**: Selected genres, UI animations
- **useEffect**: Save preferences to backend
- **useContext**: Share genres across components

### 🎰 Spinning Wheel
- **useRef**: Direct DOM manipulation for smooth animations
- **useState**: Spin state, rotation values
- **useEffect**: Animation cleanup, result display

### 🃏 3D Cards
- **useRef**: 3D transforms without re-renders
- **useState**: Mouse tracking, flip animations
- **useEffect**: Entrance animations, event listeners

### 📤 File Upload
- **useState**: Form state, upload progress
- **useContext**: Access spin results for metadata
- **useEffect**: Form validation, success handling

### 🖼️ Community Gallery
- **useState**: Filter state, like animations
- **useEffect**: Load posts, animation cleanup
- **useContext**: Global posts state, user data

## 🔄 Data Flow

```
Authentication (JWT) → Profile Data → Genre Selection → 
Spin Results → 3D Display → Upload Artwork → 
Community Gallery → Feedback Loop
```

Each step depends on React hooks working together:
1. **useContext** provides global state
2. **useState** manages local interactions  
3. **useEffect** handles side effects and API calls
4. **useRef** optimizes performance for animations

## 🛡️ Security Features

- JWT token authentication
- Protected API routes
- Input validation and sanitization
- File upload restrictions
- CORS configuration

## 📁 Project Structure

```
src/
├── components/          # React components
├── contexts/           # Context providers (Auth, Game)
├── services/           # API service layer
└── App.tsx            # Main application

server/
├── config/            # Database configuration
├── middleware/        # JWT auth middleware
├── routes/           # API route handlers
└── server.js         # Express server setup
```

## 🎯 Learning Objectives

This project teaches:
- How React hooks depend on each other
- Context API for global state management
- Real-world API integration patterns
- File upload handling
- JWT authentication flow
- Database design and relationships
- Performance optimization with useRef
- Side effect management with useEffect

Perfect for web development students learning full-stack React applications!
