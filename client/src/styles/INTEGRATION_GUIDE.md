# CSS Integration Guide

## How Components Use CSS Classes

This guide shows how React components use the custom CSS classes from our style sheets.

## Example: Dashboard Component

```jsx
// Dashboard.jsx uses classes from Dashboard.css and global.css
<div className="dashboard-container">
  {/* Page Header */}
  <div className="page-header">
    <h1 className="page-title">Dashboard</h1>
    <p className="page-description">Overview of academic fraud detection system</p>
  </div>

  {/* Stats Cards using stats-grid from layout.css */}
  <div className="stats-grid">
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-label">Total Students</div>
        <div className="stat-card-value">1250</div>
      </div>
      <div className="stat-card-icon primary">
        <UsersIcon />
      </div>
    </div>
  </div>

  {/* Alert Cards using alert-cards-grid from Dashboard.css */}
  <div className="alert-cards-grid">
    <div className="alert-card critical">
      <div className="alert-card-header">
        <h4 className="alert-card-title">Critical Cases</h4>
        <span className="alert-card-count">5</span>
      </div>
      <p className="alert-card-message">High priority fraud cases</p>
    </div>
  </div>

  {/* Charts using charts-grid from Dashboard.css */}
  <div className="charts-grid">
    <div className="chart-card">
      <h3 className="chart-title">Performance Trends</h3>
      <div className="chart-container">
        {/* Chart component */}
      </div>
    </div>
  </div>
</div>
```

## Example: Students Component

```jsx
// Students.jsx uses classes from Students.css
<div className="students-container">
  {/* Search and Filter */}
  <div className="search-filter-section">
    <div className="search-filter-wrapper">
      <div className="search-wrapper">
        <input type="text" className="search-input" placeholder="Search..." />
      </div>
      <div className="filter-wrapper">
        <select className="filter-select">
          <option>All Risk Levels</option>
        </select>
      </div>
    </div>
  </div>

  {/* Students Table */}
  <div className="students-table-container">
    <div className="students-table-header">
      <h2 className="students-table-title">Students (150)</h2>
    </div>
    <table className="table">
      {/* Table content */}
    </table>
  </div>
</div>
```

## Example: Button Component

```jsx
// Button.jsx uses classes from global.css
<button className="btn btn-primary">
  <span>Submit</span>
</button>

<button className="btn btn-secondary btn-sm">
  <span>Cancel</span>
</button>

<button className="btn btn-danger btn-full">
  <span>Delete</span>
</button>
```

## Example: Card Component

```jsx
// Card.jsx uses classes from global.css
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
  </div>
  <div className="card-body">
    <p>Card content goes here</p>
  </div>
</div>
```

## Example: Table Component

```jsx
// Table.jsx uses classes from global.css
<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>Column 1</th>
        <th>Column 2</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Data 1</td>
        <td>Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

## Example: Alert Component

```jsx
// Alert.jsx uses classes from components.css
<div className="alert-component error">
  <AlertIcon className="alert-icon" />
  <div className="alert-content">
    <p className="alert-message">An error occurred!</p>
  </div>
  <button className="alert-close">×</button>
</div>
```

## Example: Risk Badge

```jsx
// Used in Students and Reports pages
<span className="risk-badge critical">CRITICAL</span>
<span className="risk-badge high">HIGH</span>
<span className="risk-badge medium">MEDIUM</span>
<span className="risk-badge low">LOW</span>
```

## Example: Status Badge

```jsx
// Used in Reports page
<span className="status-badge pending">PENDING</span>
<span className="status-badge investigating">INVESTIGATING</span>
<span className="status-badge resolved">RESOLVED</span>
<span className="status-badge dismissed">DISMISSED</span>
```

## Layout Structure

```jsx
// App.jsx uses classes from layout.css
<div className="app-container">
  <nav className="navbar">
    <div className="navbar-container">
      {/* Navbar content */}
    </div>
  </nav>

  <aside className="sidebar">
    <nav className="sidebar-nav">
      <a href="#" className="sidebar-link active">
        <Icon className="sidebar-icon" />
        <span>Dashboard</span>
      </a>
    </nav>
  </aside>

  <main className="main-content">
    <div className="page-container">
      {/* Page content */}
    </div>
  </main>
</div>
```

## Form Example

```jsx
// Forms use classes from global.css
<form>
  <div className="form-group">
    <label className="form-label" htmlFor="email">
      Email Address
    </label>
    <input
      type="email"
      id="email"
      className="form-control"
      placeholder="Enter email"
    />
  </div>

  <div className="form-group">
    <label className="form-label" htmlFor="password">
      Password
    </label>
    <input
      type="password"
      id="password"
      className="form-control"
      placeholder="Enter password"
    />
  </div>

  <button type="submit" className="btn btn-primary btn-full">
    Login
  </button>
</form>
```

## Grid Layout Example

```jsx
// Using grid system from global.css
<div className="grid grid-cols-3 gap-lg">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Stats grid from layout.css
<div className="stats-grid">
  <div className="stat-card">...</div>
  <div className="stat-card">...</div>
  <div className="stat-card">...</div>
</div>
```

## Utility Classes Example

```jsx
// Using utility classes from global.css
<div className="flex items-center justify-between gap-md">
  <span className="text-sm font-semibold">Label</span>
  <span className="text-lg font-bold">Value</span>
</div>

<div className="flex-col gap-lg">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## Responsive Behavior

The CSS is designed to be fully responsive:

```jsx
// Desktop: 4 columns
// Tablet: 2 columns  
// Mobile: 1 column
<div className="stats-grid">
  {/* Stats cards automatically adjust */}
</div>

// Sidebar collapses on mobile
// Menu button appears on mobile
<aside className={`sidebar ${isOpen ? 'open' : ''}`}>
  {/* Sidebar content */}
</aside>
```

## Loading State Example

```jsx
// Loading.jsx uses classes from components.css
<div className="loading-fullscreen">
  <div className="loading-content">
    <div className="spinner spinner-lg"></div>
    <p className="loading-text">Loading...</p>
  </div>
</div>
```

## Best Practices

1. **Always use CSS classes** - Never use inline styles unless absolutely necessary
2. **Match class names exactly** - CSS class names must exactly match between JSX and CSS
3. **Use semantic classes** - Choose classes that describe purpose, not appearance
4. **Combine classes properly** - `className="btn btn-primary btn-sm"` not `btn-primary-sm`
5. **Follow naming conventions** - Keep consistent with existing patterns
6. **Check responsive behavior** - Test on multiple screen sizes
7. **Use CSS variables** - For colors, spacing, typography (e.g., `var(--primary-color)`)
8. **Keep specificity low** - Avoid deeply nested selectors

## Common Patterns

### Card with Action
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Title</h3>
  </div>
  <div className="card-body">
    <p>Content</p>
    <button className="btn btn-primary mt-lg">Action</button>
  </div>
</div>
```

### Empty State
```jsx
<div className="empty-state">
  <Icon className="empty-state-icon" />
  <h3 className="empty-state-title">No Data</h3>
  <p className="empty-state-message">No items found</p>
</div>
```

### Section Header
```jsx
<div className="section">
  <h2 className="section-title">Section Title</h2>
  {/* Section content */}
</div>
```
