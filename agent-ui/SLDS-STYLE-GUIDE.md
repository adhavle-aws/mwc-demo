# SLDS Style Guide for Agent UI

## Overview

This guide provides comprehensive mapping between the current Tailwind CSS styling and Salesforce Lightning Design System (SLDS) equivalents for the Agent UI application.

## Color System

### Background Colors

| Current (Tailwind) | SLDS Token | SLDS Utility Class | Hex Value |
|-------------------|------------|-------------------|-----------|
| `bg-gray-900` | `--slds-g-color-neutral-base-95` | `slds-theme_shade` | #181818 |
| `bg-gray-800` | `--slds-g-color-neutral-base-90` | `slds-box` | #3E3E3C |
| `bg-gray-700` | `--slds-g-color-neutral-base-80` | - | #706E6B |
| `bg-blue-600` | `--slds-g-color-brand-base-60` | `slds-theme_default` | #0176D3 |
| `bg-blue-700` | `--slds-g-color-brand-base-70` | - | #014486 |
| `bg-green-500` | `--slds-g-color-success-base-50` | `slds-theme_success` | #2E844A |
| `bg-yellow-500` | `--slds-g-color-warning-base-50` | `slds-theme_warning` | #FFB75D |
| `bg-red-500` | `--slds-g-color-error-base-50` | `slds-theme_error` | #EA001E |

### Text Colors

| Current (Tailwind) | SLDS Token | SLDS Utility Class | Usage |
|-------------------|------------|-------------------|-------|
| `text-white` | `--slds-g-color-neutral-base-100` | `slds-text-color_inverse` | Primary text on dark |
| `text-gray-300` | `--slds-g-color-neutral-base-30` | `slds-text-color_default` | Primary text |
| `text-gray-400` | `--slds-g-color-neutral-base-40` | `slds-text-color_weak` | Secondary text |
| `text-gray-500` | `--slds-g-color-neutral-base-50` | - | Muted text |
| `text-blue-600` | `--slds-g-color-brand-base-60` | `slds-text-color_default` | Links, accents |
| `text-green-500` | `--slds-g-color-success-base-50` | `slds-text-color_success` | Success messages |
| `text-yellow-500` | `--slds-g-color-warning-base-50` | `slds-text-color_warning` | Warnings |
| `text-red-500` | `--slds-g-color-error-base-50` | `slds-text-color_error` | Errors |

### Border Colors

| Current (Tailwind) | SLDS Token | SLDS Utility Class |
|-------------------|------------|-------------------|
| `border-gray-800` | `--slds-g-color-border-base-1` | `slds-border_top` |
| `border-gray-700` | `--slds-g-color-border-base-2` | - |
| `border-blue-600` | `--slds-g-color-brand-base-60` | - |


## Typography

### Font Families

| Current (Tailwind) | SLDS Token | SLDS Class |
|-------------------|------------|------------|
| `font-sans` (Inter) | `--slds-g-font-family-sans-serif` | Default |
| `font-mono` | `--slds-g-font-family-monospace` | `slds-text-font_monospace` |

### Font Sizes

| Current (Tailwind) | SLDS Token | SLDS Class | Size |
|-------------------|------------|------------|------|
| `text-xs` | `--slds-g-font-size-1` | `slds-text-body_x-small` | 0.625rem (10px) |
| `text-sm` | `--slds-g-font-size-2` | `slds-text-body_small` | 0.75rem (12px) |
| `text-base` | `--slds-g-font-size-3` | `slds-text-body_regular` | 0.8125rem (13px) |
| `text-lg` | `--slds-g-font-size-5` | `slds-text-heading_small` | 1rem (16px) |
| `text-xl` | `--slds-g-font-size-6` | `slds-text-heading_medium` | 1.25rem (20px) |
| `text-2xl` | `--slds-g-font-size-8` | `slds-text-heading_large` | 1.75rem (28px) |

### Font Weights

| Current (Tailwind) | SLDS Token | SLDS Class |
|-------------------|------------|------------|
| `font-normal` | `--slds-g-font-weight-regular` | Default (400) |
| `font-medium` | - | 500 |
| `font-semibold` | `--slds-g-font-weight-bold` | `slds-text-heading_*` (600) |
| `font-bold` | `--slds-g-font-weight-bold` | 700 |

### Line Heights

| Current (Tailwind) | SLDS Token | Value |
|-------------------|------------|-------|
| `leading-tight` | `--slds-g-line-height-text` | 1.25 |
| `leading-normal` | `--slds-g-line-height-text` | 1.5 |
| `leading-relaxed` | - | 1.75 |

## Spacing

### Padding

| Current (Tailwind) | SLDS Token | SLDS Class | Value |
|-------------------|------------|------------|-------|
| `p-1` | `--slds-g-spacing-1` | `slds-p-around_xxx-small` | 0.125rem |
| `p-2` | `--slds-g-spacing-2` | `slds-p-around_xx-small` | 0.25rem |
| `p-3` | `--slds-g-spacing-3` | `slds-p-around_x-small` | 0.5rem |
| `p-4` | `--slds-g-spacing-4` | `slds-p-around_small` | 0.75rem |
| `p-6` | `--slds-g-spacing-6` | `slds-p-around_medium` | 1rem |
| `p-8` | `--slds-g-spacing-8` | `slds-p-around_large` | 1.5rem |

### Margin

| Current (Tailwind) | SLDS Token | SLDS Class | Value |
|-------------------|------------|------------|-------|
| `m-1` | `--slds-g-spacing-1` | `slds-m-around_xxx-small` | 0.125rem |
| `m-2` | `--slds-g-spacing-2` | `slds-m-around_xx-small` | 0.25rem |
| `m-3` | `--slds-g-spacing-3` | `slds-m-around_x-small` | 0.5rem |
| `m-4` | `--slds-g-spacing-4` | `slds-m-around_small` | 0.75rem |
| `m-6` | `--slds-g-spacing-6` | `slds-m-around_medium` | 1rem |
| `m-8` | `--slds-g-spacing-8` | `slds-m-around_large` | 1.5rem |

### Gap (Flexbox/Grid)

| Current (Tailwind) | SLDS Class | Value |
|-------------------|------------|-------|
| `gap-2` | `slds-gutters_xx-small` | 0.25rem |
| `gap-3` | `slds-gutters_x-small` | 0.5rem |
| `gap-4` | `slds-gutters_small` | 0.75rem |
| `gap-6` | `slds-gutters` | 1rem |


## Layout

### Flexbox

| Current (Tailwind) | SLDS Class |
|-------------------|------------|
| `flex` | `slds-grid` |
| `flex-col` | `slds-grid_vertical` |
| `flex-row` | `slds-grid` (default) |
| `items-center` | `slds-grid_align-center` |
| `items-start` | `slds-grid_align-start` |
| `items-end` | `slds-grid_align-end` |
| `justify-center` | `slds-grid_align-center` |
| `justify-between` | `slds-grid_align-spread` |
| `flex-1` | `slds-col` |
| `flex-wrap` | `slds-wrap` |

### Grid

| Current (Tailwind) | SLDS Class |
|-------------------|------------|
| `grid` | `slds-grid slds-wrap` |
| `grid-cols-2` | `slds-size_1-of-2` (on children) |
| `grid-cols-3` | `slds-size_1-of-3` (on children) |
| `grid-cols-4` | `slds-size_1-of-4` (on children) |
| `gap-4` | `slds-gutters` |

### Positioning

| Current (Tailwind) | SLDS Class | Notes |
|-------------------|------------|-------|
| `fixed` | `slds-is-fixed` | Use sparingly |
| `absolute` | `slds-is-absolute` | Use sparingly |
| `relative` | `slds-is-relative` | Default in SLDS |
| `sticky` | `slds-is-sticky` | Limited support |

## Borders and Shadows

### Border Radius

| Current (Tailwind) | SLDS Token | SLDS Class | Value |
|-------------------|------------|------------|-------|
| `rounded` | `--slds-g-border-radius-2` | `slds-border-radius_medium` | 0.25rem |
| `rounded-lg` | `--slds-g-border-radius-3` | `slds-border-radius_large` | 0.5rem |
| `rounded-full` | `--slds-g-border-radius-circle` | `slds-border-radius_circle` | 50% |

### Shadows

| Current (Tailwind) | SLDS Class | Usage |
|-------------------|------------|-------|
| `shadow-sm` | `slds-box_x-small` | Subtle elevation |
| `shadow` | `slds-box_small` | Default elevation |
| `shadow-lg` | `slds-box` | Prominent elevation |
| `shadow-xl` | - | Use `slds-box` |


## Interactive States

### Hover States

| Current (Tailwind) | SLDS Class | Notes |
|-------------------|------------|-------|
| `hover:bg-gray-700` | `slds-box:hover` | Use SLDS hover utilities |
| `hover:text-white` | - | Define in component CSS |
| `hover:scale-105` | - | Use CSS transforms |

### Focus States

| Current (Tailwind) | SLDS Class | Notes |
|-------------------|------------|-------|
| `focus:outline-none` | - | SLDS provides default focus |
| `focus:ring-2` | `slds-has-focus` | Automatic in SLDS |
| `focus:ring-blue-500` | - | Use SLDS default |

### Active States

| Current (Tailwind) | SLDS Class | Notes |
|-------------------|------------|-------|
| `active:scale-90` | - | Define in component CSS |
| `active:bg-blue-700` | - | Define in component CSS |

## Transitions and Animations

### Transition Durations

| Current (Tailwind) | SLDS Token | Value |
|-------------------|------------|-------|
| `duration-150` | `--slds-g-duration-quickly` | 0.1s |
| `duration-200` | `--slds-g-duration-promptly` | 0.2s |
| `duration-300` | `--slds-g-duration-slowly` | 0.3s |
| `duration-500` | `--slds-g-duration-paused` | 0.4s |

### Transition Timing

| Current (Tailwind) | CSS Equivalent |
|-------------------|----------------|
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |

### Common Animations

```css
/* Fade In (React/Tailwind) */
.fade-in {
  animation: fadeIn 250ms ease-in-out;
}

/* SLDS Equivalent */
.slds-fade-in-open {
  animation: slds-fade-in 0.2s ease-in-out;
}

/* Slide In (React/Tailwind) */
.slide-in {
  transform: translateX(-100%);
  transition: transform 300ms ease-in-out;
}

/* SLDS Equivalent */
.slds-slide-in-left {
  animation: slds-slide-in-left 0.3s ease-in-out;
}

/* Pulse (React/Tailwind) */
.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* SLDS Equivalent */
.slds-is-pulsing {
  animation: slds-pulse 2s ease-in-out infinite;
}
```


## Component-Specific Styling

### Button Styles

```css
/* Primary Button (React/Tailwind) */
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg 
         font-medium transition-colors duration-200;
}

/* SLDS Equivalent */
<button class="slds-button slds-button_brand">
  Button Text
</button>
```

```css
/* Secondary Button (React/Tailwind) */
.btn-secondary {
  @apply bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg;
}

/* SLDS Equivalent */
<button class="slds-button slds-button_neutral">
  Button Text
</button>
```

```css
/* Icon Button (React/Tailwind) */
.btn-icon {
  @apply p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white;
}

/* SLDS Equivalent */
<lightning-button-icon
  icon-name="utility:settings"
  variant="border-filled"
  alternative-text="Settings"
></lightning-button-icon>
```

### Card Styles

```css
/* Card (React/Tailwind) */
.card {
  @apply bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700;
}

/* SLDS Equivalent */
<article class="slds-card">
  <div class="slds-card__header slds-grid">
    <header class="slds-media slds-media_center slds-has-flexi-truncate">
      <div class="slds-media__body">
        <h2 class="slds-card__header-title">
          <span>Card Title</span>
        </h2>
      </div>
    </header>
  </div>
  <div class="slds-card__body slds-card__body_inner">
    Card content
  </div>
</article>
```

### Input Styles

```css
/* Text Input (React/Tailwind) */
.input {
  @apply bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 
         text-white placeholder-gray-500 focus:border-blue-500;
}

/* SLDS Equivalent */
<lightning-input
  label="Input Label"
  value={inputValue}
  onchange={handleChange}
></lightning-input>
```

```css
/* Textarea (React/Tailwind) */
.textarea {
  @apply bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 
         text-white placeholder-gray-500 resize-none;
}

/* SLDS Equivalent */
<lightning-textarea
  label="Textarea Label"
  value={textValue}
  onchange={handleChange}
></lightning-textarea>
```


### Navigation Styles

```css
/* Side Navigation (React/Tailwind) */
.nav-item {
  @apply px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 
         hover:text-white transition-colors;
}

.nav-item-active {
  @apply bg-blue-600 text-white;
}

/* SLDS Equivalent */
<nav class="slds-nav-vertical">
  <div class="slds-nav-vertical__section">
    <ul>
      <li class="slds-nav-vertical__item">
        <a href="#" class="slds-nav-vertical__action" aria-current="page">
          Item Text
        </a>
      </li>
    </ul>
  </div>
</nav>
```

### Tab Styles

```css
/* Tabs (React/Tailwind) */
.tab {
  @apply px-4 py-2 text-gray-400 hover:text-white border-b-2 
         border-transparent hover:border-gray-600;
}

.tab-active {
  @apply text-white border-blue-500;
}

/* SLDS Equivalent */
<lightning-tabset>
  <lightning-tab label="Tab 1">
    Content 1
  </lightning-tab>
  <lightning-tab label="Tab 2">
    Content 2
  </lightning-tab>
</lightning-tabset>
```

## Responsive Design

### Breakpoints

| Current (Tailwind) | SLDS Breakpoint | Value |
|-------------------|----------------|-------|
| `sm:` | `--slds-mq-small` | 480px |
| `md:` | `--slds-mq-medium` | 768px |
| `lg:` | `--slds-mq-large` | 1024px |
| `xl:` | `--slds-mq-x-large` | 1280px |

### Responsive Utilities

```css
/* Hide on Mobile (React/Tailwind) */
.hidden md:block

/* SLDS Equivalent */
.slds-hide slds-show_medium

/* Show on Mobile Only (React/Tailwind) */
.block md:hidden

/* SLDS Equivalent */
.slds-show slds-hide_medium
```


## Icons

### Icon Usage

**React/Tailwind:**
```jsx
<svg className="w-6 h-6" fill="currentColor">
  <path d="..." />
</svg>
```

**SLDS:**
```html
<lightning-icon
  icon-name="utility:check"
  size="small"
  alternative-text="Check"
></lightning-icon>
```

### Icon Categories

- **utility**: General UI icons (check, close, settings, etc.)
- **standard**: Object icons (account, contact, opportunity, etc.)
- **action**: Action icons (new, edit, delete, etc.)
- **custom**: Custom icons

### Common Icon Mappings

| Usage | React Icon | SLDS Icon Name |
|-------|-----------|----------------|
| Check/Success | ✓ SVG | `utility:check` |
| Close/Cancel | ✕ SVG | `utility:close` |
| Menu/Hamburger | ☰ SVG | `utility:rows` |
| Settings | ⚙ SVG | `utility:settings` |
| Info | ℹ SVG | `utility:info` |
| Warning | ⚠ SVG | `utility:warning` |
| Error | ✕ SVG | `utility:error` |
| Loading | Spinner | `utility:spinner` |

## Accessibility

### ARIA Labels

**React:**
```jsx
<button aria-label="Close dialog">
```

**LWC:**
```html
<button aria-label="Close dialog">
```

### ARIA Roles

Both React and LWC use standard ARIA roles:

```html
<nav role="navigation" aria-label="Agent navigation">
<main role="main">
<aside role="complementary">
```

### Focus Management

**React:**
```javascript
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

**LWC:**
```javascript
renderedCallback() {
  if (this.shouldFocus) {
    this.template.querySelector('input')?.focus();
    this.shouldFocus = false;
  }
}
```

## Best Practices

### DO's

✅ Use SLDS utility classes whenever possible  
✅ Follow SLDS component patterns  
✅ Use design tokens for colors and spacing  
✅ Test with SLDS validator  
✅ Maintain semantic HTML structure  
✅ Use SLDS icons instead of custom SVGs  
✅ Follow SLDS accessibility guidelines  

### DON'Ts

❌ Don't override SLDS base styles unnecessarily  
❌ Don't use arbitrary color values  
❌ Don't use inline styles for layout  
❌ Don't ignore SLDS spacing system  
❌ Don't create custom components for SLDS equivalents  
❌ Don't use non-SLDS fonts  

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Reference**: [SLDS Documentation](https://www.lightningdesignsystem.com/)
