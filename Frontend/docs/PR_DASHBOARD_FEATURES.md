# Pull Request: Dashboard with Event Map & Filters

## Summary
Post-login dashboard with an OpenStreetMap-based event map (UCSB / IV area), dummy event data, and sidebar filters. Frontend-only; structured for future backend integration.

---

## Features

### Map & events
- **OpenStreetMap (Leaflet)** map on the dashboard, centered on UCSB/Isla Vista, with dark tiles to match app theme.
- **Event markers** from a dummy dataset (10 sample events: social, academic, entertainment, sports across campus and IV).
- **Click a marker** → popup shows:
  - Event name (styled with primary color)
  - Time & date (and end time if present)
  - Location
  - Type (category + subtype)
  - Food provided (free / costs extra) and free admission when applicable
  - RSVP or “More info” link when available

### Filters (sidebar)
- **Type of event** – Multi-select: Social, Academic, Entertainment, Sports.
- **Food provided** – Single choice: Any, Free, Costs extra.
- **Free admission only** – Checkbox.
- **Time range** – Single choice: All time, Today, This week, This month.

### UX & layout
- **Responsive**: Desktop (sidebar + map), mobile (sidebar as slide-over with backdrop, map full width).
- **Sidebar toggle** on mobile to open/close filters and event list.
- **Upcoming events list** in sidebar shows filtered events (name, location, short date/time, category) with count.
- **Consistent UI**: Uses existing design tokens (primary, card, border, etc.) and Tailwind classes.

### Code & data
- **Modular structure**: `lib/dashboard/` (types, dummy data, filter logic), `components/dashboard/` (layout, header, sidebar, map).
- **No backend**: All data from `DUMMY_EVENTS`; types and filter logic ready to swap for API later.
- **Client-only map**: Leaflet loaded via `next/dynamic` with `ssr: false` to avoid SSR issues.

---

## Files touched / added
- **New**: `app/dashboard/page.tsx`, `lib/dashboard/types.ts`, `lib/dashboard/dummy-events.ts`, `lib/dashboard/filter-events.ts`, `components/dashboard/*` (layout, header, sidebar, map components), `docs/PR_DASHBOARD_FEATURES.md`.
- **Updated**: `components/login-form.tsx` (redirect to `/dashboard` after login), `app/globals.css` (Leaflet popup/card styling, attribution).
- **Dependencies**: `react-leaflet`, `leaflet`, `@types/leaflet`.
