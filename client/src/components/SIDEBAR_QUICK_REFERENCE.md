# Collapsible Sidebar - Quick Reference

## 🎯 How It Works

### Desktop View (≥1024px)
1. **Expand/Collapse**: Click the round button on the sidebar's right edge
2. **Icons + Labels** (Expanded): Width = 16rem
3. **Icons Only** (Collapsed): Width = 4.5rem
4. **Hover Tooltips**: Show labels when collapsed
5. **Main Content**: Automatically adjusts margin

### Mobile View (<1024px)
1. **Hidden by Default**: Sidebar off-screen
2. **Floating Button**: Bottom-right corner (blue circular button)
3. **Tap to Open**: Slides in from left
4. **Backdrop**: Dark overlay appears
5. **Tap Backdrop/ESC**: Closes menu

## 🎨 Visual States

### Toggle Button
- **Position**: Right edge of sidebar
- **Icon**: Chevron left (expanded) / right (collapsed)
- **Hover**: Blue background with lift effect
- **Focus**: Visible outline for keyboard users

### Navigation Links
- **Default**: Gray text (hover: light blue background)
- **Active Page**: Blue background + blue text
- **Collapsed**: Centered icons with tooltips
- **Focus**: Blue outline for accessibility

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between links |
| `Enter`/`Space` | Activate focused link/button |
| `Esc` | Close mobile menu |

## 🔧 Quick Customization

### Change Starting State
```jsx
// In Sidebar.jsx, line 19
const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
```

### Modify Colors
```css
/* In global.css */
--primary-color: #your-color;
--primary-hover: #your-hover-color;
```

### Adjust Widths
```css
/* In global.css */
--sidebar-width: 18rem;           /* Expanded */
--sidebar-collapsed-width: 5rem;  /* Collapsed */
```

### Change Animation Speed
```css
/* In global.css */
--transition-base: 300ms ease-in-out;
```

## 🛠️ Common Tasks

### Add a Menu Item
```jsx
// In Sidebar.jsx, menuItems array
import { YourIcon } from 'lucide-react';

const menuItems = [
  // ...existing items
  { 
    name: 'Your Page', 
    path: '/your-path', 
    icon: YourIcon 
  },
];
```

### Change Icon Size
```css
/* In layout.css */
.sidebar-icon {
  width: 1.5rem;   /* Default: 1.25rem */
  height: 1.5rem;
}
```

### Modify Toggle Button Position
```css
/* In layout.css */
.sidebar-collapse-toggle {
  top: var(--spacing-md);    /* Vertical position */
  right: -0.9rem;            /* Horizontal offset */
}
```

## 📱 Responsive Behavior Summary

| Screen Size | Behavior | Controls |
|-------------|----------|----------|
| Desktop (≥1024px) | Always visible, toggle button on sidebar | Circle button on sidebar edge |
| Tablet (768-1023px) | Auto-collapsed on load, still toggleable | Circle button on sidebar edge |
| Mobile (<768px) | Hidden by default | Floating action button (bottom-right) |

## ♿ Accessibility Features

✅ **ARIA Labels**: All interactive elements properly labeled  
✅ **Keyboard Navigation**: Full tab navigation support  
✅ **Focus Indicators**: Visible outlines on focused elements  
✅ **Screen Readers**: Semantic HTML and descriptive labels  
✅ **Current Page**: `aria-current="page"` indicator  
✅ **Tooltips**: Labels visible on hover when collapsed  

## 🐛 Common Issues & Solutions

### Issue: Main content doesn't shift when toggling
**Solution**: Ensure `main-content` class is on your main element

### Issue: Toggle button not visible
**Solution**: Check screen width is ≥1024px (hidden on mobile)

### Issue: Transitions feel choppy
**Solution**: Check for conflicting CSS or browser extensions

### Issue: Icons not displaying
**Solution**: Verify `lucide-react` is installed: `npm install lucide-react`

## 📋 Class Reference

| Class | Purpose |
|-------|---------|
| `.sidebar` | Base sidebar container |
| `.sidebar.collapsed` | Collapsed state (desktop) |
| `.sidebar.mobile-open` | Open state (mobile) |
| `.sidebar-nav` | Navigation container |
| `.sidebar-link` | Individual nav link |
| `.sidebar-link.active` | Current/active page |
| `.sidebar-icon` | Icon wrapper |
| `.sidebar-label` | Text label |
| `.sidebar-collapse-toggle` | Desktop toggle button |
| `.menu-toggle` | Mobile menu button |
| `.sidebar-overlay` | Mobile backdrop |

## 🎓 Best Practices

1. **Don't Remove ARIA Labels**: They're essential for accessibility
2. **Test Keyboard Navigation**: Always verify tab order works
3. **Check Mobile Devices**: Test on actual devices, not just simulators
4. **Maintain Contrast**: Ensure readable text in both states
5. **Keep Icons Consistent**: Use same icon set (lucide-react)

## 📞 Need Help?

Refer to:
- **Full Documentation**: `SIDEBAR_DOCUMENTATION.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **CSS Variables**: `src/styles/global.css`
- **Sidebar Component**: `src/components/Sidebar.jsx`

---

**Last Updated**: February 9, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
