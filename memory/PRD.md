# PRD — Atlas Union Summit 2026

## Original Problem Statement
Cinematic rebrand of Atlas Union Summit. Not a conference website — a digital universe. Apple Event × Arc Browser × Formula 1 × Cyberpunk × Luxury Anime Editorial × Web Summit. Theme: विश्वम् एक मंचम् · Where Diplomacy Meets Innovation. Includes loading screen, navbar, hero (movie-poster style), 7 committees with original anime guardians, 6 "Operations", 5 locked classified cards, holographic passport, delegate timeline, FAQ, partners (mystery), Request Access form.

## User Preferences (verbatim)
- Backend: dummy / save to MongoDB
- Locked cards: unlock with cipher `2526`, animated reveal
- Passport: static showcase + live personalized generator
- Anime images: spread across all sections
- Loading screen: once per session

## Architecture
- React 19 + FastAPI + MongoDB
- Frontend: framer-motion, sonner toasts, tailwind, shadcn UI
- Anime art assets via emergent CDN (5 images)
- QR code via `api.qrserver.com`

## Implemented (Dec 2025)
- Loading screen (cinematic boot sequence — once per session)
- Floating glass Navbar + status overlays (vertical rails, ticker)
- Movie-poster Hero with Atlas Guardian artwork
- Ecosystem (pillars + side guardian)
- 7 Committees with unique accents + guardians
- 6 Operations + 5 locked classified cards w/ cipher unlock animation
- Holographic Passport with 3D scroll rotation + live generator
- Delegate Timeline (8 stages, alternating layout)
- Partners (mystery)
- FAQ accordion
- Request Access dialog → MongoDB
- Footer
- Backend: /api/access, /api/unlock (cipher 2526), /api/passport, /api/network/stats

## Backlog (P1)
- Real anime artwork variations per committee
- Audio cue on loading screen + sonic stinger on cipher unlock
- Admin dashboard to view access requests
- Email confirmation via Resend/SendGrid

## Backlog (P2)
- WebGL 3D Delhi skyline behind hero
- Live counter sync via WebSocket
- Internationalisation
- Server-side passport PDF export
