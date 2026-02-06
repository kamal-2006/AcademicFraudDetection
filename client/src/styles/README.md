# CSS Architecture Documentation

## Overview
This document outlines the CSS architecture for the Intelligent Academic Fraud Detection System (IAFDS) frontend application.

## File Structure

```
client/src/styles/
├── global.css           # Base styles, variables, typography, buttons, forms
├── layout.css           # Layout structure (navbar, sidebar, main content)
├── components.css       # Common reusable components
├── Dashboard.css        # Dashboard page specific styles
├── Students.css         # Students page specific styles
├── Attendance.css       # Attendance page specific styles
├── ExamPerformance.css  # Exam Performance page specific styles
├── Plagiarism.css       # Plagiarism page specific styles
└── Reports.css          # Fraud Reports page specific styles
```

## Import Order (in main.jsx)

1. **index.css** - Tailwind CSS base
2. **global.css** - Global variables and base styles
3. **layout.css** - Layout structure
4. **components.css** - Common components
5. **Page-specific CSS** - Individual page styles

## CSS Variables (Design System)

### Colors
- `--primary-color`: #2563eb (Blue)
- `--success-color`: #10b981 (Green)
- `--warning-color`: #f59e0b (Amber)
- `--danger-color`: #ef4444 (Red)
- `--text-primary`: #1f2937 (Dark Gray)
- `--text-secondary`: #6b7280 (Medium Gray)
- `--bg-primary`: #ffffff (White)
- `--bg-secondary`: #f9fafb (Light Gray)

### Spacing Scale
- `--spacing-xs`: 0.25rem (4px)
- `--spacing-sm`: 0.5rem (8px)
- `--spacing-md`: 1rem (16px)
- `--spacing-lg`: 1.5rem (24px)
- `--spacing-xl`: 2rem (32px)
- `--spacing-2xl`: 3rem (48px)

### Typography Scale
- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 1.875rem (30px)
- `--font-size-4xl`: 2.25rem (36px)

### Font Weights
- `--font-weight-normal`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700

### Border Radius
- `--border-radius-sm`: 0.375rem
- `--border-radius-md`: 0.5rem
- `--border-radius-lg`: 0.75rem
- `--border-radius-xl`: 1rem
- `--border-radius-full`: 9999px

### Shadows
- `--shadow-sm`: Subtle shadow
- `--shadow-md`: Medium shadow
- `--shadow-lg`: Large shadow
- `--shadow-xl`: Extra large shadow

## Component Classes

### Buttons
- `.btn` - Base button class
- `.btn-primary` - Primary blue button
- `.btn-secondary` - Secondary gray button
- `.btn-success` - Success green button
- `.btn-danger` - Danger red button
- `.btn-outline` - Outlined button
- `.btn-sm` - Small button
- `.btn-lg` - Large button
- `.btn-full` - Full width button

### Forms
- `.form-group` - Form field wrapper
- `.form-label` - Form label
- `.form-control` - Input/select/textarea

### Cards
- `.card` - Base card
- `.card-header` - Card header
- `.card-title` - Card title
- `.card-body` - Card content

### Tables
- `.table` - Base table
- `.table-container` - Scrollable table wrapper

### Badges
- `.badge` - Base badge
- `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`, `.badge-secondary`

### Alerts
- `.alert` - Base alert
- `.alert-success`, `.alert-error`, `.alert-warning`, `.alert-info`

## Layout Classes

### Main Structure
- `.app-container` - Main app wrapper
- `.navbar` - Fixed top navigation
- `.sidebar` - Fixed side navigation
- `.main-content` - Main content area
- `.page-container` - Page content wrapper

### Grid System
- `.grid` - CSS Grid container
- `.grid-cols-1`, `.grid-cols-2`, `.grid-cols-3`, `.grid-cols-4`
- `.stats-grid` - Stats cards grid
- `.content-grid` - Content grid

### Flexbox Utilities
- `.flex` - Flex container
- `.flex-col` - Flex column
- `.items-center` - Align items center
- `.justify-between` - Justify space between
- `.justify-center` - Justify center
- `.gap-sm`, `.gap-md`, `.gap-lg`, `.gap-xl`

## Page-Specific Classes

### Dashboard
- `.dashboard-container`
- `.alert-cards-grid`
- `.alert-card` (with `.critical`, `.high`, `.medium`, `.low`)
- `.charts-grid`
- `.chart-card`

### Students
- `.students-container`
- `.search-filter-section`
- `.search-wrapper`, `.filter-wrapper`
- `.risk-badge` (with `.low`, `.medium`, `.high`, `.critical`)

### Attendance
- `.attendance-container`
- `.attendance-summary-grid`
- `.attendance-status-badge` (with `.good`, `.warning`, `.critical`)

### Exam Performance
- `.exams-container`
- `.anomaly-badge` (with status variants)
- `.exam-guidelines-card`

### Plagiarism
- `.plagiarism-container`
- `.similarity-badge` (with `.low`, `.medium`, `.high`, `.critical`)
- `.plagiarism-guidelines-card`

### Reports
- `.reports-container`
- `.report-detail-grid`
- `.status-badge` (with `.pending`, `.investigating`, `.resolved`, `.dismissed`)
- `.student-profile-card`

## Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

### Responsive Behavior
- Sidebar collapses to mobile menu on tablets and below
- Grid columns reduce on smaller screens
- Font sizes scale down on mobile
- Padding/spacing reduces on mobile

## Best Practices

1. **Use CSS Variables**: Always use CSS variables for colors, spacing, typography
2. **Avoid Inline Styles**: Use CSS classes instead
3. **Semantic Class Names**: Use descriptive, semantic class names
4. **Component Scoping**: Keep page-specific styles in page-specific CSS files
5. **Mobile-First**: Design for mobile first, then enhance for desktop
6. **Consistent Spacing**: Use spacing scale, never arbitrary values
7. **Accessibility**: Ensure sufficient color contrast and focus states
8. **Performance**: Minimize CSS specificity, avoid deep nesting

## Naming Conventions

- **BEM-inspired**: `.block-element--modifier`
- **Page prefix**: Page-specific classes start with page name (e.g., `.dashboard-`, `.students-`)
- **State classes**: Use descriptive states (`.active`, `.open`, `.disabled`)
- **Utility classes**: Keep utility classes generic and reusable

## Color Usage Guidelines

### Primary Actions
Use `--primary-color` for main CTAs, links, and primary UI elements

### Status Indicators
- **Success**: Green (`--success-color`) - Completed, approved, good status
- **Warning**: Amber (`--warning-color`) - Caution, medium risk
- **Danger**: Red (`--danger-color`) - Critical, high risk, errors
- **Info**: Blue (`--info-color`) - Information, neutral notifications

### Text Hierarchy
- **Primary**: `--text-primary` - Headings, important text
- **Secondary**: `--text-secondary` - Body text, descriptions
- **Light**: `--text-light` - Placeholder text, less important info

## Maintaining the CSS

1. **Adding New Components**: Create component-specific classes in `components.css`
2. **New Pages**: Create a new page-specific CSS file and import in `main.jsx`
3. **Global Changes**: Update CSS variables in `global.css`
4. **Layout Changes**: Modify `layout.css` for structural changes
5. **Testing**: Test on all breakpoints (desktop, tablet, mobile)

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Performance Considerations

- CSS files are loaded in proper order for efficient cascade
- Minimal specificity to reduce browser work
- CSS variables for efficient theme changes
- Optimized selectors for fast rendering
- No unused CSS (thanks to component-based structure)
