# My Watchlist — Build Plan

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | Firebase Auth (Google OAuth + Email/Password w/ verification) |
| Database | Firebase Firestore |
| Anime API | AniList GraphQL API (free, no key needed) |
| Icons | Lucide React |
| UI Extras | clsx, tailwind-merge |

---

## Features
- 🔐 **Auth** — Landing/login page, Google OAuth, email+password w/ verification
- 🔍 **Search** — AniList API search for Anime & Donghua 3D separately
- 📋 **Watchlist** — Add/remove titles, track status (Watching, Completed, Plan to Watch, On Hold, Dropped)
- 📈 **Progress** — Track current episode vs total episodes
- ⭐ **Ratings & Notes** — Personal score + free-text notes per title
- 🗂️ **Filter/Sort** — By status, genre, rating, type
- 🌗 **Dark mode** — System preference + manual toggle
- 📑 **Tabs** — Separate Anime vs Donghua 3D sections

---

## Route Structure
```
/                        → Landing page (hero, features, login/register CTA)
/auth/login              → Login form (Google + email)
/auth/register           → Register form (email + password)
/auth/verify-email       → Email verification prompt
/dashboard               → Overview (stats, recently added, currently watching)
/anime                   → Anime watchlist (filter, sort, grid/list view)
/anime/search            → Search & add anime
/donghua                 → Donghua 3D watchlist
/donghua/search          → Search & add donghua
/profile                 → User profile & settings
```

---

## File Structure
```
src/
  app/
    layout.tsx                  ← Root layout (fonts, providers)
    globals.css                 ← Tailwind + theme vars
    page.tsx                    ← Landing page
    auth/
      login/page.tsx
      register/page.tsx
      verify-email/page.tsx
    dashboard/
      layout.tsx                ← Sidebar + navbar
      page.tsx
    anime/
      page.tsx                  ← Anime watchlist
      search/page.tsx
    donghua/
      page.tsx
      search/page.tsx
    profile/page.tsx
  components/
    ui/                         ← Reusable primitives (Button, Card, Badge, Input, Modal...)
    layout/                     ← Navbar, Sidebar, Footer
    auth/                       ← LoginForm, RegisterForm, GoogleSignInButton
    watchlist/                  ← WatchlistCard, WatchlistGrid, StatusBadge, ProgressBar
    search/                     ← SearchBar, SearchResultCard, AddToWatchlistModal
    dashboard/                  ← StatsCard, RecentlyAdded, CurrentlyWatching
  lib/
    firebase.ts                 ← Firebase client init
    firebase-admin.ts           ← (if needed for server)
    anilist.ts                  ← AniList GraphQL client & queries
    firestore.ts                ← Firestore helpers (CRUD for watchlist)
    auth-context.tsx            ← AuthContext + useAuth hook
  types/
    anime.ts                    ← AniList types
    watchlist.ts                ← Watchlist item types
```

---

## Build Order
1. Install dependencies (firebase, lucide-react, clsx, tailwind-merge)
2. Firebase setup (lib/firebase.ts, AuthContext)
3. Global layout, theme, globals.css
4. Landing page + Auth pages
5. Shared layout (Navbar/Sidebar) for protected routes
6. AniList API client + search UI
7. Firestore watchlist CRUD
8. Watchlist pages (Anime + Donghua) with filter/sort
9. Dashboard (stats)
10. Profile page
