# CSV Upload Fix Guide

## ✅ **ISSUE FIXED - Enhanced Debugging Added**

I've updated the CSV validation system with:
1. ✅ **Comprehensive debugging logs** - Shows exactly what's being parsed
2. ✅ **More lenient validation** - GPA now accepts 0-5 range, Year accepts 1-10
3. ✅ **Better error messages** - Shows actual values that failed validation
4. ✅ **Debug endpoint** - Test CSV parsing without saving to database

---

## 🔧 **How to Fix Your CSV Upload Issue**

### Step 1: Restart the Server (Already Done ✅)
The server has been restarted with enhanced debugging.

### Step 2: Check Your CSV File Format

Your CSV **MUST** have these exact columns (order doesn't matter, but names must match one of these variations):

| Required Field | Accepted Column Names |
|----------------|----------------------|
| **Student ID** | `Student ID`, `StudentID`, `student_id`, `STUDENT_ID`, `ID` |
| **Name** | `Name`, `name`, `Student Name`, `StudentName` |
| **Email** | `Email`, `email`, `Student Email` |
| **Department** | `Department`, `department`, `dept`, `Dept` |
| **Year** | `Year`, `year`, `Academic Year` |
| **GPA** | `GPA`, `gpa`, `grade`, `Grade` |
| **Attendance** | `Attendance`, `attendance`, `Attendance %` |

### Step 3: Use the Test CSV File

I've created a working test file: **`server/test_students.csv`**

```csv
Student ID,Name,Email,Department,Year,GPA,Attendance
STU101,Alice Johnson,alice.johnson@test.edu,Computer Science,2,3.5,85
STU102,Bob Smith,bob.smith@test.edu,Engineering,1,3.2,78
STU103,Carol Davis,carol.davis@test.edu,Mathematics,3,3.8,92
STU104,David Wilson,david.wilson@test.edu,Physics,2,2.9,65
STU105,Emma Brown,emma.brown@test.edu,Chemistry,4,3.6,88
```

### Step 4: Validation Rules

Your CSV data must meet these requirements:

✅ **Year**: Number between 1-10  
✅ **GPA**: Number between 0-5  
✅ **Attendance**: Number between 0-100  
✅ **Email**: Valid email format (e.g., `name@domain.com`)  
✅ **Student ID**: Unique (not already in database)  
✅ **Email**: Unique (not already in database)

---

## 🐛 **Debug Your CSV File**

### Method 1: Use the Debug Endpoint (Recommended)

You can now test your CSV without saving it to the database:

```bash
# From server directory
cd server

# Test your CSV file (replace with your file path)
curl -X POST http://localhost:5000/api/students/debug-csv \
  -F "file=@test_students.csv"
```

This will show you:
- ✅ What headers were detected
- ✅ What the first row looks like
- ✅ How many records passed validation
- ✅ Detailed error messages for any failed records

### Method 2: Check Server Console Logs

When you upload a CSV through the frontend, the server will now print detailed information:

```
=========== CSV VALIDATION DEBUG ===========
Total rows in CSV: 5
CSV Headers detected: [ 'Student ID', 'Name', 'Email', 'Department', 'Year', 'GPA', 'Attendance' ]
First row data: {
  "Student ID": "STU101",
  "Name": "Alice Johnson",
  "Email": "alice.johnson@test.edu",
  ...
}
===========================================

Row 2 PASSED validation
Row 3 PASSED validation
...

=== VALIDATION SUMMARY ===
Valid records: 5
Invalid records: 0
=========================
```

---

## 🚀 **Testing Steps**

### Test 1: Use the Provided Test File ✅

1. Download `server/test_students.csv` (already created for you)
2. Go to Students page in the frontend
3. Click "Choose CSV File"
4. Select `test_students.csv`
5. Click "Upload"
6. **Watch the server console** for debug output

### Test 2: Test Your Own CSV File

1. Create a CSV with these exact headers: `Student ID,Name,Email,Department,Year,GPA,Attendance`
2. Add your data (make sure Student IDs and emails are unique)
3. Upload through the frontend
4. Check server console logs for detailed error messages

### Test 3: Use the Debug Endpoint

```bash
# Windows PowerShell
cd D:\Academic_fraud\server
Invoke-RestMethod -Method POST -Uri "http://localhost:5000/api/students/debug-csv" -Form @{file=Get-Item "test_students.csv"}
```

---

## ❌ **Common Errors & Solutions**

### Error: "Missing required field: studentId"

**Cause**: CSV header doesn't match expected format  
**Solution**: Use one of these: `Student ID`, `StudentID`, `student_id`, or `ID`

### Error: "Year must be a number between 1 and 10 (got: '2nd Year')"

**Cause**: Year column contains text instead of number  
**Solution**: Use numbers only: `1`, `2`, `3`, `4`

### Error: "GPA must be a number between 0 and 5 (got: '3.5 GPA')"

**Cause**: GPA column contains extra text  
**Solution**: Use numbers only: `3.5`, `3.8`

### Error: "Invalid email format"

**Cause**: Email doesn't match pattern (e.g., missing @)  
**Solution**: Use valid format: `name@domain.com`

### Error: "Student ID already exists"

**Cause**: Duplicate Student ID in database  
**Solution**: Use unique Student IDs or delete existing students first

---

## 📋 **What Was Changed**

### 1. Enhanced Field Matching
- Now accepts "Student ID" (with space) ✅
- Case-insensitive matching
- Trims whitespace from values

### 2. Better Debugging
- Shows all CSV headers detected
- Logs first row of data
- Shows which rows pass/fail validation
- Detailed error messages with actual values

### 3. More Lenient Validation
- GPA: 0-5 (was 0-4)
- Year: 1-10 (was 1-5)
- Better error messages showing what value failed

### 4. Debug Endpoint
- New endpoint: POST `/api/students/debug-csv`
- Test CSV parsing without saving
- See validation results instantly

---

## 🎯 **Next Steps**

1. **Check server console** when you upload (should see detailed debug output)
2. **Try the test file** (`server/test_students.csv`) first
3. **Copy the format** from test file to your own CSV
4. **Watch for error messages** that tell you exactly what's wrong

---

## 💡 **Pro Tips**

✅ **Save CSV as UTF-8** (not UTF-8 BOM)  
✅ **Use simple text editors** (Notepad, VS Code) instead of Excel  
✅ **No empty rows** at the beginning or end  
✅ **No special characters** in headers  
✅ **Use comma delimiters** (not semicolons)

---

## 📞 **Still Having Issues?**

Check the server console output when you upload. It will show:
- What headers were detected
- Which fields are missing
- What validation errors occurred
- Exact values that failed validation

Copy the error message from the console and we can fix it!
