# Mobile Responsive Guidelines

## Touch Target Sizes

**Minimum**: 44x44px (iOS HIG and WCAG 2.1 Level AAA)
**Recommended**: 48x48px

### Implementation

```tsx
// Buttons
<Button className="min-h-[44px] min-w-[44px]">Click me</Button>

// Links
<Link className="inline-block min-h-[44px] p-3">Link</Link>

// Icons
<Icon className="h-6 w-6" /> // Inside 44x44px container
```

## Breakpoints (Tailwind)

- `sm`: 640px - Small devices (landscape phones)
- `md`: 768px - Medium devices (tablets)
- `lg`: 1024px - Large devices (desktops)
- `xl`: 1280px - Extra large devices
- `2xl`: 1536px - 2X large devices

## Layout Patterns

### Responsive Grid

```tsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Responsive Flex

```tsx
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  <h1>Title</h1>
  <Button>Action</Button>
</div>
```

### Responsive Table

Use `ResponsiveTable` component which switches to card view on mobile:

```tsx
import { ResponsiveTable } from "@/components/ui/responsive-table"

<ResponsiveTable
  data={athletes}
  columns={[
    { header: "Name", accessor: "name", mobileLabel: "Athlete" },
    { header: "Email", accessor: "email" },
    { header: "Role", accessor: "role" },
  ]}
  keyExtractor={(item) => item.id}
  onRowClick={(item) => router.push(`/athletes/${item.id}`)}
/>
```

## Typography

### Responsive Font Sizes

```tsx
// Headings
<h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>

// Body text - keep readable on mobile
<p className="text-base md:text-lg">
  Responsive paragraph
</p>
```

### Line Length

Optimal: 45-75 characters per line

```tsx
<div className="mx-auto max-w-prose">
  <p>Long form content...</p>
</div>
```

## Spacing

### Container Padding

```tsx
<div className="container mx-auto px-4 md:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Section Spacing

```tsx
<section className="py-8 md:py-12 lg:py-16">
  {/* Content */}
</section>
```

## Forms

### Mobile-Friendly Inputs

```tsx
<input
  type="email"
  // Prevent zoom on iOS
  className="text-base"
  // Add autocomplete
  autoComplete="email"
  // Appropriate input types
  inputMode="email"
/>

<input
  type="tel"
  inputMode="tel"
  autoComplete="tel"
/>

<input
  type="number"
  inputMode="numeric"
/>
```

### Form Layout

```tsx
<form className="space-y-4">
  {/* Stack on mobile, side-by-side on desktop */}
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <Input label="First Name" />
    <Input label="Last Name" />
  </div>

  {/* Full width button on mobile */}
  <Button className="w-full md:w-auto">
    Submit
  </Button>
</form>
```

## Navigation

### Mobile Menu

Use slide-in menu with backdrop:

```tsx
import { MobileMenu, MobileMenuItem } from "@/components/ui/mobile-menu"

<MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <MobileMenuItem active={pathname === "/dashboard"}>
    <Icon />
    <span>Dashboard</span>
  </MobileMenuItem>
</MobileMenu>
```

### Sticky Navigation

```tsx
<nav className="sticky top-0 z-50 bg-white shadow">
  {/* Nav content */}
</nav>
```

## Images

### Responsive Images

```tsx
import Image from "next/image"

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  className="h-auto w-full"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

## Modals & Overlays

### Full-Screen on Mobile

```tsx
<Dialog>
  <DialogContent className="h-full w-full md:h-auto md:max-w-lg">
    {/* Content */}
  </DialogContent>
</Dialog>
```

## Performance

### Lazy Loading

```tsx
import dynamic from "next/dynamic"

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <Skeleton />,
  ssr: false, // Don't render on server for mobile
})
```

### Conditional Loading

```tsx
const isMobile = useMediaQuery("(max-width: 768px)")

{isMobile ? <MobileView /> : <DesktopView />}
```

## Testing

### Viewport Sizes to Test

- **Mobile**: 375x667 (iPhone SE), 390x844 (iPhone 12)
- **Tablet**: 768x1024 (iPad), 820x1180 (iPad Air)
- **Desktop**: 1366x768, 1920x1080

### Testing Tools

- Chrome DevTools Device Mode
- Safari Responsive Design Mode
- Real devices (iOS and Android)
- BrowserStack/LambdaTest for cross-browser

### Testing Checklist

- [ ] All text is readable without zooming
- [ ] All tap targets are >= 44x44px
- [ ] No horizontal scrolling (except intentional)
- [ ] Forms are easy to fill on mobile
- [ ] Tables work on small screens (card view or horizontal scroll)
- [ ] Navigation is accessible
- [ ] Images load efficiently
- [ ] Performance is acceptable (< 3s LCP on 3G)

## Common Issues

### Prevent Zoom on Input Focus (iOS)

```css
input, select, textarea {
  font-size: 16px; /* Prevents zoom */
}
```

### Safe Area Insets (iPhone notch)

```css
.container {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### Disable Pull-to-Refresh (if needed)

```css
body {
  overscroll-behavior-y: contain;
}
```

## Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [WCAG 2.1 Success Criterion 2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
