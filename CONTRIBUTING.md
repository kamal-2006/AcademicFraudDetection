# Contributing to Academic Fraud Detection System

First off, thank you for considering contributing to the Academic Fraud Detection System! It's people like you that make this project better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project team.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bugfix
4. Make your changes
5. Test your changes thoroughly
6. Push to your fork
7. Submit a pull request

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub issues. When creating a bug report, please include:

- **Clear descriptive title**
- **Detailed description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** (if applicable)
- **Environment details** (OS, Node version, browser, etc.)

**Example Bug Report:**

```markdown
**Title:** Attendance percentage calculation incorrect for February

**Description:**
When creating an attendance record for February with 28 total classes
and 25 attended classes, the system calculates 89.28% instead of 89.29%.

**Steps to Reproduce:**
1. Go to Attendance page
2. Click "Add Attendance"
3. Enter: totalClasses=28, attendedClasses=25
4. Submit form

**Expected:** 89.29%
**Actual:** 89.28%

**Environment:**
- OS: Windows 11
- Node: v20.11.0
- Browser: Chrome 122
```

### Suggesting Enhancements

Enhancement suggestions are also tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Clear descriptive title**
- **Detailed description** of the proposed feature
- **Use case** - why is this enhancement useful?
- **Possible implementation** (if you have ideas)
- **Alternative solutions** you've considered

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v7.0 or higher)
- Git

### Setup Steps

1. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Academic_fraud.git
   cd Academic_fraud
   ```

2. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/Academic_fraud.git
   ```

3. **Install dependencies:**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install
   ```

4. **Set up environment files:**
   ```bash
   # Backend
   cp server/.env.example server/.env
   # Edit server/.env with your configuration

   # Frontend
   cp client/.env.example client/.env
   # Edit client/.env with your configuration
   ```

5. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

## Coding Standards

### JavaScript/React

- Use **ES6+ syntax** (const, let, arrow functions, destructuring)
- Use **functional components** with hooks for React
- Follow **ESLint** rules (run `npm run lint`)
- Use **meaningful variable names**
- Add **JSDoc comments** for complex functions
- Keep functions **small and focused** (single responsibility)

**Example:**

```javascript
/**
 * Calculates attendance percentage
 * @param {number} attended - Number of classes attended
 * @param {number} total - Total number of classes
 * @returns {number} Attendance percentage (0-100)
 */
const calculateAttendancePercentage = (attended, total) => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100 * 100) / 100;
};
```

### React Components

- Use **PascalCase** for component names
- Use **camelCase** for prop names
- Extract reusable logic into **custom hooks**
- Use **prop-types** or TypeScript for type checking
- Keep component files under **250 lines** (split larger components)

**Example:**

```jsx
const AttendanceCard = ({ student, percentage, status }) => {
  const statusColor = getStatusColor(status);
  
  return (
    <Card className={`border-l-4 ${statusColor}`}>
      <h3>{student.name}</h3>
      <p>Attendance: {percentage}%</p>
      <Badge status={status} />
    </Card>
  );
};
```

### Backend/Express

- Use **async/await** for asynchronous code
- Always use **try-catch** blocks for error handling
- Return **consistent response format**: `{ success, data, message }`
- Use **HTTP status codes** correctly (200, 201, 400, 404, 500)
- Add **input validation** before processing
- Use **Mongoose schema validation**

**Example:**

```javascript
exports.createAttendance = async (req, res) => {
  try {
    const { studentId, subject, totalClasses, attendedClasses } = req.body;
    
    // Validation
    if (!studentId || !subject || !totalClasses || !attendedClasses) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Business logic
    const attendance = await Attendance.create(req.body);
    
    res.status(201).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### CSS/Tailwind

- Use **Tailwind utility classes** first
- Create **custom CSS** only when necessary
- Use **CSS modules** for component-specific styles
- Follow **mobile-first** responsive design
- Use **semantic class names** for custom CSS

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
feat(attendance): add bulk delete functionality

Added ability to select multiple attendance records and
delete them in a single operation. Includes confirmation
dialog and success notification.

Closes #123

---

fix(exam): correct grade calculation for percentage

Fixed rounding issue in grade calculation that was causing
grades to be assigned incorrectly near boundary values.

Fixes #456

---

docs(readme): update installation instructions

Updated Node.js version requirement from v14 to v16 and
added troubleshooting section for common MongoDB issues.
```

## Pull Request Process

1. **Update your fork** with the latest changes from upstream:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit them following commit guidelines

4. **Test your changes:**
   - Run all tests: `npm test`
   - Check for linting errors: `npm run lint`
   - Test manually in the browser

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub with:
   - **Clear title** describing the change
   - **Detailed description** of what was changed and why
   - **Screenshots** (if UI changes)
   - **Related issue numbers** (e.g., "Closes #123")
   - **Checklist** of completed items

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes
- [ ] Related issues are referenced
```

## Code Review Process

All submissions require review. We use GitHub pull requests for this purpose.

- At least **one approval** required before merging
- All **CI checks must pass**
- **No merge conflicts** with main branch
- **Documentation updated** if needed

## Questions?

Feel free to ask questions by:
- Creating a GitHub issue
- Contacting the maintainers

Thank you for contributing! 🎉
