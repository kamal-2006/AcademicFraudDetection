# Quick Start Guide - Testing the Students API

## 🚀 Server Status

✅ **Backend Server:** Running on `http://localhost:5000`  
✅ **Database:** MongoDB Connected  
✅ **API Base URL:** `http://localhost:5000/api/students`

---

## 📋 Quick Test Steps

### Step 1: Upload Sample CSV File

**Using Postman:**
1. Open Postman
2. Create new request
3. Set method to `POST`
4. URL: `http://localhost:5000/api/students/upload`
5. Go to "Body" tab
6. Select "form-data"
7. Add key: `file` (change type to "File")
8. Click "Select Files" and choose `sample_students.csv`
9. Click "Send"

**Using cURL:**
```bash
cd server
curl -X POST http://localhost:5000/api/students/upload -F "file=@sample_students.csv"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully processed CSV file",
  "summary": {
    "totalRecords": 15,
    "validRecords": 15,
    "inserted": 15,
    "duplicates": 0,
    "validationErrors": 0
  }
}
```

---

### Step 2: View All Students

**Using Browser/Postman:**
```
GET http://localhost:5000/api/students
```

**Using cURL:**
```bash
curl http://localhost:5000/api/students
```

**Expected Response:**
```json
{
  "success": true,
  "data": [ /* array of 10 students */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalRecords": 15,
    "pageSize": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### Step 3: Search for Students

**Search by name "John":**
```
GET http://localhost:5000/api/students?search=John
```

**Using cURL:**
```bash
curl "http://localhost:5000/api/students?search=John"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "studentId": "STU001",
      "name": "John Doe",
      "email": "john.doe@university.edu",
      "department": "Computer Science",
      "gpa": 3.5,
      "attendance": 92,
      "riskLevel": "Low"
    }
  ]
}
```

---

### Step 4: Filter by Risk Level

**Get all "High" risk students:**
```
GET http://localhost:5000/api/students?riskLevel=High
```

**Using cURL:**
```bash
curl "http://localhost:5000/api/students?riskLevel=High"
```

---

### Step 5: Get Risk Statistics

```
GET http://localhost:5000/api/students/stats/risk
```

**Using cURL:**
```bash
curl http://localhost:5000/api/students/stats/risk
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 15,
    "riskDistribution": [
      {
        "riskLevel": "Low",
        "count": 8,
        "percentage": "53.33",
        "avgGpa": "3.55",
        "avgAttendance": "91.25"
      },
      {
        "riskLevel": "Medium",
        "count": 3,
        "percentage": "20.00"
      },
      {
        "riskLevel": "High",
        "count": 2,
        "percentage": "13.33"
      },
      {
        "riskLevel": "Critical",
        "count": 2,
        "percentage": "13.33"
      }
    ]
  }
}
```

---

### Step 6: Advanced Filtering

**Multiple filters + pagination:**
```
GET http://localhost:5000/api/students?department=Computer Science&year=3&page=1&limit=5
```

**Using cURL:**
```bash
curl "http://localhost:5000/api/students?department=Computer%20Science&year=3&page=1&limit=5"
```

---

## 🎯 Common Use Cases

### Use Case 1: Find At-Risk Students
```
GET /api/students?riskLevel=Critical
GET /api/students?riskLevel=High
```

### Use Case 2: Department-wise Analysis
```
GET /api/students?department=Computer Science
GET /api/students/filters/departments  (get all departments)
```

### Use Case 3: Year-wise Filter
```
GET /api/students?year=1  (First year students)
GET /api/students?year=4  (Final year students)
```

### Use Case 4: Combined Search & Filter
```
GET /api/students?search=Smith&department=Engineering&riskLevel=Medium
```

### Use Case 5: Pagination for Large Datasets
```
GET /api/students?page=1&limit=20
GET /api/students?page=2&limit=20
```

---

## 📊 Understanding the Response

### Success Response Structure:
```json
{
  "success": true,          // Request successful
  "data": [],              // Array of students or single object
  "pagination": {          // Only for list endpoints
    "currentPage": 1,
    "totalPages": 2,
    "totalRecords": 15,
    "pageSize": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Error Response Structure:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## 🔍 Testing Checklist

- [ ] Upload CSV file successfully
- [ ] View uploaded students
- [ ] Search by name (e.g., "John")
- [ ] Search by student ID (e.g., "STU001")
- [ ] Search by email
- [ ] Filter by risk level (Low, Medium, High, Critical)
- [ ] Filter by department
- [ ] Filter by year
- [ ] Combine multiple filters
- [ ] Test pagination (page 1, page 2)
- [ ] Get risk statistics
- [ ] Get departments list
- [ ] Try uploading duplicate records (should be detected)
- [ ] Try uploading invalid CSV (should show errors)

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot POST /api/students/upload"
**Solution:** Make sure server is running. Check that you're using `POST` method.

### Issue 2: "Please upload a CSV file"
**Solution:** Ensure field name is exactly `file` in form-data.

### Issue 3: "File too large"
**Solution:** CSV file must be under 5MB.

### Issue 4: "Invalid file type"
**Solution:** Only `.csv` files are accepted.

### Issue 5: "Duplicate Student ID"
**Solution:** Student IDs must be unique. Check CSV for duplicates or existing database records.

### Issue 6: Empty response
**Solution:** No students in database yet. Upload CSV first.

---

## 💡 Tips

1. **Start Fresh:** To test from scratch, you can delete all students:
   ```
   DELETE http://localhost:5000/api/students/bulk/all
   ```
   ⚠️ Warning: This deletes ALL student records!

2. **Use Pagination:** Don't fetch all records at once. Use `limit` parameter.

3. **Case-Insensitive Search:** Search works regardless of case (John = john = JOHN).

4. **Flexible CSV Formats:** Column names can be in different formats (camelCase, snake_case, Title Case).

5. **Auto Risk Calculation:** You can omit `riskLevel` in CSV, it will be calculated automatically.

---

## 📱 Example Frontend Integration

```javascript
// React Hook for fetching students
const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  const fetchStudents = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
        ...filters,
      });
      
      const response = await fetch(
        `http://localhost:5000/api/students?${params}`
      );
      const data = await response.json();
      
      setStudents(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  return { students, loading, pagination, fetchStudents };
};

// Usage in component
const StudentsPage = () => {
  const { students, loading, pagination, fetchStudents } = useStudents();
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('');

  useEffect(() => {
    fetchStudents(1, { search, riskLevel });
  }, [search, riskLevel]);

  return (
    <div>
      <input 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search students..."
      />
      
      <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
        <option value="">All Risk Levels</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Critical">Critical</option>
      </select>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table>
          {students.map(student => (
            <tr key={student._id}>
              <td>{student.studentId}</td>
              <td>{student.name}</td>
              <td>{student.department}</td>
              <td>{student.gpa}</td>
              <td>{student.attendance}%</td>
              <td>{student.riskLevel}</td>
            </tr>
          ))}
        </table>
      )}

      <Pagination {...pagination} onPageChange={(page) => fetchStudents(page, { search, riskLevel })} />
    </div>
  );
};
```

---

## ✅ You're Ready!

The Students API is fully functional and ready for frontend integration. All endpoints are working correctly:

✅ CSV Upload  
✅ Student Listing  
✅ Search & Filter  
✅ Pagination  
✅ Statistics  
✅ CRUD Operations  

Happy coding! 🚀
