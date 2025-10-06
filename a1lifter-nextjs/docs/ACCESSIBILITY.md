# Accessibility Guidelines (WCAG 2.1 AA)

## Overview
This document outlines accessibility standards and implementation guidelines for A1Lifter platform to achieve WCAG 2.1 AA compliance.

## Color Contrast Requirements

### Minimum Contrast Ratios
- **Normal text** (< 18pt): 4.5:1
- **Large text** (≥ 18pt or ≥ 14pt bold): 3:1
- **UI components and graphics**: 3:1

### Testing Tools
- Chrome DevTools Accessibility Pane
- WebAIM Color Contrast Checker
- Lighthouse Accessibility Audit

## Keyboard Navigation

### Required Keyboard Shortcuts
- **Tab**: Move focus forward
- **Shift + Tab**: Move focus backward
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dialogs
- **Arrow keys**: Navigate within components (menus, lists)

### Focus Management
```tsx
// Trap focus within modals
import { FocusTrap } from '@/components/ui/focus-trap'

<FocusTrap>
  <Dialog>...</Dialog>
</FocusTrap>
```

### Focus Indicators
- All interactive elements must have visible focus indicators
- Minimum 2px outline
- Use `focus-visible:` for keyboard-only focus

```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
```

## Screen Reader Support

### Semantic HTML
- Use appropriate HTML5 elements: `<nav>`, `<main>`, `<aside>`, `<section>`, `<article>`
- Avoid generic `<div>` for interactive elements

### ARIA Labels and Roles
```tsx
// Button with icon only
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// Navigation landmark
<nav aria-label="Main navigation">
  {/* nav items */}
</nav>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  Notification message
</div>

// Loading states
<button aria-busy="true" disabled>
  <Loader2 className="animate-spin" />
  Loading...
</button>
```

### Form Labels
```tsx
// Always associate labels with inputs
<label htmlFor="email">Email address</label>
<input id="email" type="email" name="email" />

// Error messages
<input
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && <p id="email-error" role="alert">{error}</p>}
```

## Skip Links

Skip-to-content link for keyboard users:
```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
>
  Skip to main content
</a>
```

## Images and Media

### Alt Text
```tsx
// Decorative images
<img src="..." alt="" role="presentation" />

// Informative images
<img src="athlete.jpg" alt="John Doe competing in powerlifting event" />

// Complex images (charts, diagrams)
<figure>
  <img src="chart.png" alt="Performance chart" aria-describedby="chart-desc" />
  <figcaption id="chart-desc">
    Detailed description of the chart data...
  </figcaption>
</figure>
```

### Video/Audio
- Provide captions for video content
- Provide transcripts for audio content
- Add audio descriptions where needed

## Interactive Components

### Buttons vs Links
- **Buttons**: For actions (submit, open modal, toggle)
- **Links**: For navigation (go to another page)

```tsx
// Correct usage
<button onClick={handleSubmit}>Submit form</button>
<Link href="/events">View events</Link>

// Incorrect
<a onClick={handleSubmit}>Submit form</a>  // ❌
<button onClick={() => router.push('/events')}>View events</button>  // ❌
```

### Modal Dialogs
```tsx
<Dialog
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-description">Dialog description...</p>
  {/* content */}
</Dialog>
```

### Comboboxes and Autocomplete
```tsx
<input
  role="combobox"
  aria-expanded={isOpen}
  aria-controls="listbox-id"
  aria-autocomplete="list"
/>
<ul id="listbox-id" role="listbox">
  <li role="option" aria-selected={selected}>Option 1</li>
</ul>
```

## Tables

### Data Tables
```tsx
<table>
  <caption>Event leaderboard</caption>
  <thead>
    <tr>
      <th scope="col">Rank</th>
      <th scope="col">Athlete</th>
      <th scope="col">Total (kg)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">1</th>
      <td>John Doe</td>
      <td>500.5</td>
    </tr>
  </tbody>
</table>
```

## Forms

### Field Validation
```tsx
<div>
  <label htmlFor="weight">Weight (kg)</label>
  <input
    id="weight"
    type="number"
    aria-required="true"
    aria-invalid={!!errors.weight}
    aria-describedby={errors.weight ? "weight-error" : "weight-hint"}
  />
  <p id="weight-hint" className="text-sm text-gray-500">
    Enter weight in kilograms
  </p>
  {errors.weight && (
    <p id="weight-error" role="alert" className="text-sm text-red-600">
      {errors.weight}
    </p>
  )}
</div>
```

### Required Fields
- Mark with `aria-required="true"`
- Visual indicator (asterisk) with sr-only text
```tsx
<label htmlFor="name">
  Name
  <span aria-label="required">*</span>
</label>
```

## Touch Targets

### Minimum Size
- **Mobile**: 44x44 CSS pixels (iOS HIG, WCAG AAA)
- **Desktop**: 24x24 CSS pixels (WCAG AA)

```tsx
// Mobile-friendly button
<Button className="min-h-[44px] min-w-[44px]">
  Click me
</Button>
```

## Animation and Motion

### Respect User Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// In Tailwind
className="motion-reduce:transition-none motion-reduce:animate-none"
```

## Testing Checklist

### Manual Testing
- [ ] Tab through entire page - all interactive elements focusable
- [ ] Focus indicators visible and clear
- [ ] No keyboard traps (can always tab out)
- [ ] Test with screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Test forms with screen reader
- [ ] Test modals and overlays with keyboard and screen reader
- [ ] Zoom to 200% - content still readable and usable
- [ ] Test with browser zoom disabled (text-only zoom)

### Automated Testing
```bash
# Run Lighthouse
npm run build
npx lighthouse http://localhost:3000 --view

# axe DevTools
# Install browser extension and run audit
```

### Screen Reader Testing

**VoiceOver (Mac)**
- Enable: Cmd + F5
- Navigate: VO (Ctrl + Option) + Arrow keys
- Read all: VO + A

**NVDA (Windows)**
- Download from nvaccess.org
- Navigate: Arrow keys
- Read all: Insert + Down arrow

## Common WCAG AA Violations

### ❌ Missing alt text
```tsx
<img src="photo.jpg" />  // ❌
<img src="photo.jpg" alt="Athlete lifting barbell" />  // ✅
```

### ❌ Low contrast text
```tsx
<p className="text-gray-400">  // ❌ May not meet 4.5:1
<p className="text-gray-700 dark:text-gray-300">  // ✅
```

### ❌ Non-descriptive link text
```tsx
<a href="/event/123">Click here</a>  // ❌
<a href="/event/123">View National Championship event</a>  // ✅
```

### ❌ Form without labels
```tsx
<input placeholder="Email" />  // ❌
<label htmlFor="email">Email</label>
<input id="email" placeholder="you@example.com" />  // ✅
```

### ❌ Missing skip link
```tsx
// Add at top of layout
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Checklist](https://webaim.org/standards/wcag/checklist)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
