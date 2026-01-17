# MTS 1040 Intake Portal - Design Guidelines

## Design Approach
**System-Based with Financial Dashboard Inspiration**

Drawing from modern tax and financial platforms (TurboTax, Gusto, Stripe Dashboard) combined with Material Design principles for form-heavy interfaces. The design prioritizes trust, clarity, and efficiency over visual flair.

**Core Principle**: Professional confidence through clean hierarchy and generous whitespace. This is a tool users rely on for important financial tasks.

---

## Typography System

**Font Stack**: Inter (Google Fonts) for entire application
- **Headings**: 600 weight, sizes: text-3xl (dashboard headers), text-2xl (page titles), text-xl (section headers)
- **Body**: 400 weight, text-base for forms/content, text-sm for labels/metadata
- **Data/Numbers**: 500 weight, tabular-nums for alignment in tables and financial figures
- **Emphasis**: 500 weight for important callouts, CTAs

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16**
- Component padding: p-4 to p-6 for cards, p-8 for page containers
- Section gaps: space-y-6 for form groups, space-y-8 for page sections
- Grid gaps: gap-4 for cards, gap-6 for dashboard layouts

**Container Strategy**:
- Dashboard shell: Fixed sidebar (w-64), main content area with max-w-7xl mx-auto px-6
- Form containers: max-w-3xl for optimal form readability
- Tables/data views: Full width within container bounds

---

## Component Library

### Navigation
**Sidebar Navigation** (Preparer/Admin):
- Fixed left sidebar, full height, subtle border-right
- Logo/brand at top (h-16)
- Navigation items with icon + label, active state with accent background
- User profile section at bottom with role badge

**Top Bar** (Client view):
- Horizontal navigation, sticky, height h-16
- Logo left, navigation center, user menu right
- Progress indicator for multi-step intake forms

### Dashboard Layouts
**Client Dashboard**:
- Welcome banner with current tax year and filing status
- 2-column grid (lg:grid-cols-2) for key cards: "Upload Documents", "Review Information", "Tax Summary"
- Timeline/status tracker showing intake progress
- Recent activity list (single column, max-w-2xl)

**Preparer/Admin Dashboard**:
- Stats grid (grid-cols-1 md:grid-cols-3) showing KPIs: "Pending Reviews", "Completed Returns", "Awaiting Client"
- Table view of client cases with sortable columns, action buttons
- Quick filters sidebar (can collapse on mobile)

### Forms
**Form Structure**:
- Single column, max-w-3xl
- Grouped sections with clear headings (text-xl, mb-4)
- Each field group in card with subtle background, p-6, rounded-lg
- Labels above inputs (text-sm, font-medium, mb-2)
- Helper text below inputs (text-sm, muted)
- Required field indicators: asterisk after label

**Input Components**:
- Text inputs: h-10, px-3, rounded-md, border
- Textareas: min-h-[120px]
- Select dropdowns: Consistent height with text inputs
- File upload: Dashed border dropzone, p-8, with upload icon and instructions
- Checkboxes/Radio: Align left with clear labels, comfortable touch targets (min-w-5 min-h-5)

**Buttons**:
- Primary: px-6 py-2.5, rounded-md, font-medium
- Secondary: Same size, border variant
- Destructive: Reserved for delete/cancel actions
- Icon buttons: Square (w-10 h-10) for table actions

### Data Display
**Tables**:
- Striped rows for readability
- Column headers: Sticky, font-medium, text-sm
- Cell padding: px-4 py-3
- Actions column: Right-aligned with icon buttons
- Responsive: Stack on mobile with card layout

**Cards**:
- Subtle border, rounded-lg, p-6
- Header with title and optional action button
- Consistent shadow: shadow-sm
- Hover state for interactive cards: shadow-md transition

**Status Badges**:
- Pill shape: px-3 py-1, rounded-full, text-xs, font-medium
- Distinct states: Pending, In Progress, Completed, Requires Action
- Positioned inline with headings or in table cells

### Document Management
**Upload Areas**:
- Large dropzone with icon, heading, and file type instructions
- File list below with name, size, remove button
- Progress indicators during upload
- Preview thumbnails for PDFs/images (grid-cols-2 md:grid-cols-4)

**Document Viewer**:
- Modal overlay for document preview
- Navigation between multiple documents
- Download and delete actions

---

## Responsive Behavior

**Breakpoints**:
- Mobile-first: Stack all grids to single column
- md (768px): 2-column layouts emerge
- lg (1024px): Full dashboard with sidebar, 3-column grids

**Mobile-Specific**:
- Sidebar becomes slide-out drawer
- Tables transform to card layout
- Sticky headers for long forms
- Bottom navigation for client view

---

## Images & Visual Assets

**Icons**: Heroicons (outline for navigation, solid for status indicators)

**Photography/Illustrations**: Minimal use
- Login/auth pages: Abstract gradient background or subtle pattern (no photography)
- Empty states: Simple illustration + helpful text (e.g., "No documents uploaded yet")
- Dashboard: Icon-based, no hero images

**Branding**: 
- Logo placeholder at 180x48px (actual logo from MTS 1040)
- Favicon and mobile icons

---

## Accessibility Standards
- All forms use proper label/input associations
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Keyboard navigation for all functions
- Color contrast minimum WCAG AA

---

## Animation Philosophy
**Minimal and Purposeful**:
- Page transitions: None (instant navigation for speed)
- Loading states: Subtle spinner or skeleton screens
- Micro-interactions: Button hover (slight scale/shadow), dropdown open (slide-down)
- Avoid: Page scroll animations, complex entrance effects

This is a professional tool—speed and clarity trump visual flair.