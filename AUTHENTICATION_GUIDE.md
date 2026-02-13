# 🔐 Authentication System Guide - IAFDS

## ✅ Implementation Complete!

A complete **JWT-based authentication system** has been successfully implemented for the Intelligent Academic Fraud Detection System (IAFDS) with separate roles for **Admin** and **Faculty**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features Implemented](#features-implemented)
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [Quick Start](#quick-start)
- [Testing the System](#testing-the-system)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Security Features](#security-features)

---

## 🎯 Overview

The authentication system provides:
- **Secure user registration** (Faculty only)
- **Login/Logout functionality** for Admin and Faculty
- **JWT token-based authentication**
- **Password hashing** with bcrypt
- **Protected routes** requiring authentication
- **Role-based access control** (Admin/Faculty)
- **User profile management**

---

## ✨ Features Implemented

### Backend Features
✅ **User Model** with MongoDB schema
✅ **Password hashing** using bcrypt (automatic on save)
✅ **JWT token generation** and verification
✅ **Authentication middleware** for protected routes
✅ **Role-based authorization** middleware
✅ **Registration API** (Faculty only)
✅ **Login API** (Admin + Faculty)
✅ **Logout API**
✅ **Get Profile API**
✅ **Admin initialization script**

### Frontend Features
✅ **Beautiful Login Page** with modern UI
✅ **Faculty Registration Page** with validation
✅ **Profile Page** displaying user information
✅ **Authentication Context** with React hooks
✅ **Protected Routes** (redirect to login if not authenticated)
✅ **Logout functionality** in Sidebar
✅ **Token management** in localStorage
✅ **Automatic token refresh** on page load
✅ **Error handling** and user feedback

---

## 🛠️ Backend Implementation

### File Structure
```
server/
├── src/
│   ├── models/
│   │   └── User.js                 # User model with password hashing
│   ├── controllers/
│   │   └── authController.js       # Auth logic (register, login, profile)
│   ├── routes/
│   │   └── authRoutes.js           # Auth endpoints
│   └── middleware/
│       └── auth.js                 # JWT verification & role authorization
└── initialize_admin.js             # Script to create admin user
```

### Database Schema (User Collection)

```javascript
{
  _id: ObjectId,
  name: String,              // Required, 2-100 characters
  email: String,             // Required, unique, validated
  password: String,          // Hashed with bcrypt, min 6 characters
  role: String,              // 'admin' or 'faculty'
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

### Key Backend Files

#### 1. **User Model** ([`server/src/models/User.js`](../server/src/models/User.js))
- Mongoose schema with validation
- Auto-hashes passwords before saving
- `comparePassword()` method for login
- Excludes password from queries by default

#### 2. **Auth Controller** ([`server/src/controllers/authController.js`](../server/src/controllers/authController.js))
- `register()` - Faculty registration
- `login()` - User authentication
- `logout()` - Session termination
- `getProfile()` - Fetch logged-in user data
- `createAdmin()` - Create admin account

#### 3. **Auth Middleware** ([`server/src/middleware/auth.js`](../server/src/middleware/auth.js))
- `protect` - Verify JWT token
- `authorize(...roles)` - Check user role

#### 4. **Auth Routes** ([`server/src/routes/authRoutes.js`](../server/src/routes/authRoutes.js))
```javascript
POST   /api/auth/register      # Faculty registration
POST   /api/auth/login         # Login (Admin/Faculty)
POST   /api/auth/logout        # Logout
GET    /api/auth/profile       # Get user profile (protected)
POST   /api/auth/create-admin  # Create admin (setup only)
```

---

## 🎨 Frontend Implementation

### File Structure
```
client/src/
├── pages/
│   ├── Login.jsx              # Login page with modern UI
│   ├── Register.jsx           # Faculty registration page
│   └── Profile.jsx            # User profile page
├── context/
│   └── AuthContext.jsx        # Authentication state management
├── components/
│   ├── ProtectedRoute.jsx     # Route protection component
│   └── Sidebar.jsx            # Updated with Profile & Logout
└── styles/
    ├── Auth.css               # Authentication pages styling
    └── Profile.css            # Profile page styling
```

### Key Frontend Files

#### 1. **AuthContext** ([`client/src/context/AuthContext.jsx`](../client/src/context/AuthContext.jsx))
- Manages authentication state
- Provides `login()`, `register()`, `logout()` functions
- Auto-loads user from token on mount
- Sets JWT token in Axios headers

#### 2. **Login Page** ([`client/src/pages/Login.jsx`](../client/src/pages/Login.jsx))
- Two-column layout with branding
- Email/password form with validation
- Show/hide password toggle
- Demo credentials display
- Error handling

#### 3. **Register Page** ([`client/src/pages/Register.jsx`](../client/src/pages/Register.jsx))
- Faculty-only registration
- Name, email, password, confirm password fields
- Client-side validation
- Password strength requirements

#### 4. **Profile Page** ([`client/src/pages/Profile.jsx`](../client/src/pages/Profile.jsx))
- Displays user information
- User ID, Name, Email, Role
- Member since date
- Account information cards
- Logout button

#### 5. **Protected Routes** ([`client/src/components/ProtectedRoute.jsx`](../client/src/components/ProtectedRoute.jsx))
- Checks if user is authenticated
- Redirects to login if not authorized
- Shows loading state

---

## 🚀 Quick Start

### Step 1: Initialize Admin User

```bash
cd server
node initialize_admin.js
```

**Output:**
```
✨ Admin user created successfully!

==================================================
📧 Email: admin@iafds.edu
🔑 Password: admin123
👤 Role: admin
🆔 ID: 698eb2f9b6818906998f59c8
==================================================
```

### Step 2: Start Backend Server

```bash
cd server
npm run dev
```

Server runs on `http://localhost:5000`

### Step 3: Start Frontend

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173`

### Step 4: Test Authentication

1. **Visit:** `http://localhost:5173`
2. **Login as Admin:**
   - Email: `admin@iafds.edu`
   - Password: `admin123`
3. **Register Faculty:**
   - Click "Sign up as Faculty"
   - Fill in the form
4. **View Profile:**
   - Click "Profile" in sidebar
5. **Logout:**
   - Click "Logout" in sidebar

---

## 🧪 Testing the System

### Test Admin Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@iafds.edu",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "698eb2f9b6818906998f59c8",
      "name": "System Administrator",
      "email": "admin@iafds.edu",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Test Faculty Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. John Smith",
    "email": "john.smith@iafds.edu",
    "password": "securepass123"
  }'
```

### Test Protected Route (Get Profile)

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📖 API Documentation

### Authentication Endpoints

#### 1. Register (Faculty Only)
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Dr. Jane Doe",
  "email": "jane.doe@iafds.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Dr. Jane Doe",
      "email": "jane.doe@iafds.edu",
      "role": "faculty"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@iafds.edu",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "System Administrator",
      "email": "admin@iafds.edu",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Profile (Protected)
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "System Administrator",
    "email": "admin@iafds.edu",
    "role": "admin",
    "createdAt": "2026-02-13T..."
  }
}
```

#### 4. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 👥 User Roles

### Admin
- **Access:** Full system access
- **Registration:** Created via `initialize_admin.js` script
- **Credentials:** Email: `admin@iafds.edu`, Password: `admin123`
- **Permissions:** Can manage all system features

### Faculty
- **Access:** Standard user access
- **Registration:** Self-registration through `/register` page
- **Permissions:** Can access student data, generate reports, monitor fraud

---

## 🔒 Security Features

### Password Security
- ✅ **Hashing:** bcrypt with salt (10 rounds)
- ✅ **Min Length:** 6 characters required
- ✅ **Storage:** Never stored in plain text
- ✅ **Validation:** Strong password patterns enforced

### Token Security
- ✅ **JWT:** JSON Web Tokens for stateless auth
- ✅ **Expiration:** 7 days (configurable via `JWT_EXPIRE`)
- ✅ **Secret Key:** Stored in environment variable
- ✅ **Verification:** Middleware validates on each request
- ✅ **Storage:** Stored in localStorage (client-side)

### API Security
- ✅ **Protected Routes:** Require valid JWT token
- ✅ **Role Authorization:** Middleware checks user roles
- ✅ **CORS:** Configured for specific origin
- ✅ **Input Validation:** Mongoose schema validation
- ✅ **Error Handling:** Secure error messages (no sensitive data leaks)

### Frontend Security
- ✅ **Protected Routes:** Redirect to login if not authenticated
- ✅ **Token Management:** Auto-cleanup on logout
- ✅ **XSS Prevention:** React's built-in protection
- ✅ **CSRF Protection:** Token-based requests

---

## ⚙️ Configuration

### Environment Variables

Update `server/.env`:

```env
# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# MongoDB
MONGO_URI=mongodb://localhost:27017/iafds

# Server
PORT=5000
NODE_ENV=development
```

⚠️ **Important:** Change `JWT_SECRET` in production!

---

## 🎨 UI Design

### Login Page Features
- Two-column responsive layout
- Gradient background with branding
- Email/password inputs with icons
- Show/hide password toggle
- Loading states
- Error messages
- Demo credentials display
- Link to registration

### Register Page Features
- Similar design to login page
- Name, email, password, confirm password fields
- Client-side validation
- Password strength indicators
- Success/error messages
- Link to login page

### Profile Page Features
- User avatar with icon
- Role badge (Admin/Faculty)
- User information cards
- Account security info
- Logout button
- Responsive design

---

## 🐛 Troubleshooting

### Issue: "401 Unauthorized"
**Solution:** Check if token is valid and included in request headers
```javascript
Authorization: Bearer <token>
```

### Issue: "User not found"
**Solution:** Run `node initialize_admin.js` to create admin user

### Issue: "Cannot register"
**Solution:** Only faculty can register through public endpoint

### Issue: "MongooseError: Operation buffering timed out"
**Solution:** Ensure MongoDB is running on `localhost:27017`

---

## 📝 Next Steps

### Recommended Enhancements
- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Session timeout handling
- [ ] Remember me functionality
- [ ] Admin user management panel
- [ ] Activity logging
- [ ] Rate limiting for login attempts

---

## 📚 Additional Resources

- [JWT Documentation](https://jwt.io/)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [React Context API](https://react.dev/reference/react/useContext)
- [Mongoose Documentation](https://mongoosejs.com/)

---

## 🎉 Summary

✅ **Backend:** Complete JWT authentication with User model, controllers, routes, and middleware  
✅ **Frontend:** Beautiful login/register pages, profile page, protected routes  
✅ **Security:** Password hashing, token-based auth, role-based access  
✅ **Admin Created:** Email: `admin@iafds.edu`, Password: `admin123`  
✅ **Ready to Use:** Full authentication system operational!

---

**Need Help?** Check the [README.md](../README.md) or contact the development team.

**Last Updated:** February 13, 2026
