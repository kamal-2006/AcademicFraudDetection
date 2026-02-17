# 🚀 Quick Start Guide - Academic Fraud Detection System

This guide will help you set up and run the complete Academic Fraud Detection System with full database integration.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

## Step-by-Step Setup

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Set Up MongoDB

#### Option A: Local MongoDB
```bash
# Windows (as Administrator)
net start MongoDB

# Linux
sudo systemctl start mongod

# Mac
brew services start mongodb-community
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Use in .env file

### 3. Configure Environment Variables

#### Backend (.env file)
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/academic_fraud_db
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRE=7d
```

#### Frontend (.env file)
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Initialize Database

#### Create Admin User
```bash
cd server
node initialize_admin.js
```

Default admin credentials:
- Email: `admin@iafds.com`
- Password: `admin123`

**⚠️ IMPORTANT: Change these credentials after first login!**

#### (Optional) Add Sample Data
```bash
# Full sample data (students, attendance, exams, fraud reports)
node populate_sample_data.js

# OR quick student population only
node quick_populate_students.js
```

### 5. Start the Application

#### Terminal 1 - Backend Server
```bash
cd server
npm start
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

#### Terminal 2 - Frontend Client
```bash
cd client
npm run dev
```

Expected output:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 6. Access the Application

1. Open browser: http://localhost:5173
2. Login with admin credentials
3. Start using the system!

## 🧪 Testing the API

### Using the Test Scripts

```bash
cd server

# Test authentication
node test_api.js

# Test student CSV upload
node test_csv_upload.js

# Test attendance and exam APIs
node test_attendance_exam_api.js

# Test fraud report APIs
node test_fraud_api.js
```

### Using Postman/Thunder Client

Import the following endpoints:

**Authentication:**
```
POST http://localhost:5000/api/auth/login
Body: {"email": "admin@iafds.com", "password": "admin123"}
```

**Get Dashboard Stats:**
```
GET http://localhost:5000/api/dashboard/stats
Headers: Authorization: Bearer <your_token>
```

**Get All Students:**
```
GET http://localhost:5000/api/students?page=1&limit=10
Headers: Authorization: Bearer <your_token>
```

## 📊 Available Modules

### 1. Dashboard
- **URL:** http://localhost:5173/dashboard
- **Features:** Overview statistics, trends, recent activities

### 2. Students
- **URL:** http://localhost:5173/students
- **Features:** View, add, edit, delete students, CSV upload

### 3. Attendance
- **URL:** http://localhost:5173/attendance
- **Features:** Track attendance, view statistics, identify low attendance

### 4. Exam Performance
- **URL:** http://localhost:5173/exam-performance
- **Features:** Record exams, view performance, identify failing students

### 5. Plagiarism
- **URL:** http://localhost:5173/plagiarism
- **Features:** Detect plagiarism, track similarity scores, manage cases

### 6. Fraud Reports
- **URL:** http://localhost:5173/fraud-reports
- **Features:** View all fraud reports, export data, manage investigations

### 7. Profile
- **URL:** http://localhost:5173/profile
- **Features:** View/edit user profile, change password

## 🔧 Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Error:** `MongoNetworkError: failed to connect to server`

**Solution:**
```bash
# Check if MongoDB is running
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl status mongod
```

### Issue 2: Port Already in Use
**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find and kill the process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Issue 3: JWT Token Invalid
**Error:** `401 Unauthorized`

**Solution:**
- Clear browser localStorage
- Login again to get new token
- Check JWT_SECRET in .env matches

### Issue 4: CORS Error
**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
- Verify VITE_API_BASE_URL in client/.env
- Check backend CORS configuration
- Ensure both frontend and backend are running

### Issue 5: CSV Upload Not Working
**Error:** `No valid records found in CSV file`

**Solution:**
- Use the provided template: `client/public/student_template.csv`
- Ensure CSV has correct headers
- Check server console for detailed error messages

## 📝 Sample Data

### Student CSV Format
```csv
studentId,name,email,department,year,gpa,attendance
STU001,John Doe,john@example.com,Computer Science,3,3.5,85
STU002,Jane Smith,jane@example.com,Electrical Engineering,2,3.8,92
```

### Creating Attendance Record
```json
{
  "studentId": "STU001",
  "subject": "Data Structures",
  "totalClasses": 30,
  "attendedClasses": 25,
  "month": "February",
  "year": 2026,
  "semester": "Spring"
}
```

### Creating Exam Record
```json
{
  "studentId": "STU001",
  "examName": "Midterm Exam",
  "examType": "Midterm",
  "subject": "Algorithms",
  "totalMarks": 100,
  "obtainedMarks": 85,
  "semester": "Spring",
  "year": 2026,
  "examDate": "2026-02-15"
}
```

### Creating Fraud Report
```json
{
  "studentId": "STU001",
  "fraudType": "Plagiarism",
  "plagiarismScore": 85,
  "riskScore": 85,
  "systemRemarks": "High similarity detected in assignment",
  "matchedSources": [
    {
      "source": "Internet Source",
      "similarity": 85,
      "url": "https://example.com"
    }
  ]
}
```

## 🔐 Security Notes

1. **Change Default Credentials:** Always change admin password after first login
2. **JWT Secret:** Use a strong, random JWT_SECRET in production
3. **Environment Variables:** Never commit .env files to version control
4. **MongoDB:** Use authentication in production (username/password)
5. **HTTPS:** Always use HTTPS in production
6. **CORS:** Restrict CORS to specific domains in production

## 🚀 Deployment (Production)

### Backend Deployment (Example: Heroku)
```bash
# Add Procfile
echo "web: node server.js" > Procfile

# Set environment variables
heroku config:set MONGO_URI=<your_mongodb_atlas_uri>
heroku config:set JWT_SECRET=<your_secret>
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Frontend Deployment (Example: Vercel)
```bash
# Build frontend
cd client
npm run build

# Deploy to Vercel
vercel --prod
```

### Update Frontend API URL
After deploying backend, update `client/.env`:
```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

## 📚 Additional Resources

- **MongoDB Documentation:** https://docs.mongodb.com/
- **Node.js Documentation:** https://nodejs.org/docs
- **React Documentation:** https://react.dev/
- **Express.js Documentation:** https://expressjs.com/
- **Mongoose Documentation:** https://mongoosejs.com/docs/

## 🆘 Getting Help

If you encounter issues:

1. Check server console for errors
2. Check browser console for errors
3. Review the BACKEND_IMPLEMENTATION_COMPLETE.md
4. Check MongoDB logs
5. Verify all environment variables are set correctly

## ✅ Verification Checklist

Before starting development:

- [ ] MongoDB is installed and running
- [ ] Node.js is installed (v16+)
- [ ] Dependencies installed (npm install)
- [ ] Environment files configured (.env)
- [ ] Admin user created
- [ ] Backend server running (port 5000)
- [ ] Frontend dev server running (port 5173)
- [ ] Can login to the application
- [ ] Dashboard loads with data

---

**🎉 You're all set! Happy coding!**

For detailed API documentation, see `BACKEND_IMPLEMENTATION_COMPLETE.md`
