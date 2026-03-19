# Implementation Plan: GenNews Frontend

## Overview

Build the GenNews React + JavaScript SPA from scratch using Vite, Tailwind CSS, React Router v6, Axios, and Vitest + fast-check. Tasks follow the design.md structure and are ordered so each step integrates cleanly into the previous one.

## Tasks

- [ ] 1. Project scaffolding and configuration
  - Scaffold Vite + React + JavaScript project (`npm create vite@latest -- --template react`)
  - Install dependencies: react-router-dom, axios, tailwindcss, vitest, @testing-library/react, @testing-library/jest-dom, fast-check, jsdom, @vitejs/plugin-react
  - Configure `tailwind.config.js`, `vite.config.js` with vitest settings (globals, jsdom environment, setupFiles)
  - Create `src/test-setup.js` importing `@testing-library/jest-dom`
  - Create the full `src/` directory skeleton (api/, components/, pages/, hooks/, context/, utils/, __tests__/)
  - _Requirements: 1.4, 19.1_

- [ ] 2. API layer
  - [ ] 2.1 Create `src/api/client.js` — Axios instance with `baseURL: 'http://localhost:8000'`, request interceptor attaching Bearer token from localStorage, response interceptor normalizing errors to `{ status, message, retryable }`
    - _Requirements: 17.1, 17.2_

  - [ ] 2.2 Create `src/api/articles.js` — functions: `getArticles(params)`, `getArticle(id)`, `analyzeArticle(req)`
    - _Requirements: 5.1, 9.1, 13.3_

  - [ ] 2.3 Create `src/api/clusters.js` — `getCluster(id)`
    - _Requirements: 11.1_

  - [ ] 2.4 Create `src/api/publishers.js` — `getPublishers()`, `getPublisher(id)`
    - _Requirements: 14.2, 14.4_

  - [ ] 2.5 Create `src/api/stats.js` — `getStats()`
    - _Requirements: 4.1_

- [ ] 3. Utility helpers
  - [ ] 3.1 Create `src/utils/credibility.js` — `getCredibilityColor(score)` returning Tailwind class strings (green ≥ 0.7, yellow 0.3–0.69, red < 0.3), `getCredibilityLabel(score)` returning verdict string
    - _Requirements: 9.5, 14.3_

  - [ ]* 3.2 Write property test for `getCredibilityColor` and `getCredibilityLabel` (Property 2)
    - **Property 2: CredibilityBadge color encoding**
    - **Validates: Requirements 9.5, 14.3**
    - Use `fc.float({ min: 0, max: 1 })` covering all three threshold regions
    - File: `src/__tests__/utils/credibility.test.js`

  - [ ] 3.3 Create `src/utils/validation.js` — `isValidEmail(s)`, `isNonEmptyText(s)`, `isValidUrl(s)`
    - _Requirements: 7.5, 13.5_

- [ ] 4. Auth context
  - [ ] 4.1 Create `src/context/AuthContext.jsx` — `AuthProvider` using `useReducer`; `login(email, password)` calls `POST /api/auth/login`, stores token in localStorage; `logout()` clears token and cache; expose `useAuth()` hook
    - _Requirements: 7.3, 7.4, 3.1, 4.1_

- [ ] 5. In-memory cache and data-fetching hooks
  - [ ] 5.1 Create `src/hooks/cache.js` — module-level `Map` with 60s TTL; `getCached`, `setCached`, `clearCache`
    - _Requirements: 19.3_

  - [ ] 5.2 Create `src/hooks/useArticles.js` — fetches `GET /api/articles` with filter params, returns `{ data, loading, error, refetch }`; uses cache
    - _Requirements: 5.1, 6.2, 19.3_

  - [ ] 5.3 Create `src/hooks/useArticle.js` — fetches `GET /api/articles/{id}`, returns `{ data, loading, error, refetch }`
    - _Requirements: 9.1_

  - [ ] 5.4 Create `src/hooks/useCluster.js` — fetches `GET /api/clusters/{id}`, returns `{ data, loading, error, refetch }`
    - _Requirements: 11.1_

  - [ ] 5.5 Create `src/hooks/usePublisher.js` — fetches `GET /api/publishers/{id}`, returns `{ data, loading, error, refetch }`
    - _Requirements: 14.4_

  - [ ] 5.6 Create `src/hooks/useStats.js` — fetches `GET /api/stats`, returns `{ data, loading, error, refetch }`
    - _Requirements: 4.1_

  - [ ] 5.7 Create `src/hooks/useInfiniteScroll.js` — IntersectionObserver-based hook that calls `onLoadMore` when sentinel element enters viewport
    - _Requirements: 5.3, 8.6_

- [ ] 6. Common UI components
  - [ ] 6.1 Create `src/components/common/LoadingSkeleton.jsx` — animated pulse skeleton block, accepts `className` for sizing
    - _Requirements: 1.5_

  - [ ] 6.2 Create `src/components/common/ErrorState.jsx` — displays error message, optional "Try again" button via `onRetry` prop
    - _Requirements: 17.1, 17.2, 17.4_

  - [ ] 6.3 Create `src/components/common/EmptyState.jsx` — displays a message when a list is empty
    - _Requirements: 8.4_

- [ ] 7. Article components
  - [ ] 7.1 Create `src/components/article/CredibilityBadge.jsx` — renders color-coded badge with `aria-label="Credibility: {verdict} ({score})"` using `getCredibilityColor`
    - _Requirements: 9.4, 9.5, 20.4_

  - [ ]* 7.2 Write property test for CredibilityBadge aria-label (Property 3)
    - **Property 3: CredibilityBadge accessibility**
    - **Validates: Requirements 20.4**
    - Use `fc.tuple(fc.float({ min: 0, max: 1 }), fc.constantFrom('Likely Credible', 'Needs Verification', 'Potentially Unreliable'))`
    - File: `src/__tests__/components/CredibilityBadge.test.jsx`

  - [ ] 7.3 Create `src/components/article/RiskTag.jsx` — small label pill for a single risk indicator string
    - _Requirements: 9.6, 15.6_

  - [ ] 7.4 Create `src/components/article/ArticleCard.jsx` — renders title (link to `/articles/:id`), publisher name (link to `/publishers/:id`) + reputation badge, relative timestamp, category pill, `CredibilityBadge`; `role="article"` with descriptive aria-labels
    - _Requirements: 5.4, 14.1, 20.1_

  - [ ]* 7.5 Write property test for ArticleCard renders all required fields (Property 1)
    - **Property 1: ArticleCard renders all required fields**
    - **Validates: Requirements 5.4, 14.1**
    - Use `fc.record({ id: fc.integer(), title: fc.string(), publisher_name: fc.string(), ... })` for full ArticleSummary shape
    - File: `src/__tests__/components/ArticleCard.test.jsx`

  - [ ] 7.6 Create `src/components/article/ArticleList.jsx` — renders a list of `ArticleCard` components with infinite scroll sentinel at the bottom
    - _Requirements: 5.2, 5.3_

- [ ] 8. Dashboard components
  - [ ] 8.1 Create `src/components/dashboard/DashboardLocked.jsx` — lock icon + "Sign in to start the metrics" text + link to `/login`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 8.2 Create `src/components/dashboard/DashboardPanel.jsx` — fetches stats via `useStats`, renders `articles_analyzed`, `active_clusters`, `tracked_publishers`; shows `LoadingSkeleton` while loading; shows `ErrorState` with retry on failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 8.3 Write property test for DashboardPanel renders all platform metrics (Property 10)
    - **Property 10: Dashboard stats renders all platform metrics**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Use `fc.record({ articles_analyzed: fc.integer({ min: 0 }), active_clusters: fc.integer({ min: 0 }), tracked_publishers: fc.integer({ min: 0 }) })`
    - File: `src/__tests__/components/DashboardPanel.test.jsx`

- [ ] 9. News detail components
  - [ ] 9.1 Create `src/components/news/CoverageMap.jsx` — renders total source count, publisher list with reputation badge, star icon + "Original Source" label for `is_original_source`, "No cluster data available" empty state when cluster is null
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 9.2 Write property test for CoverageMap renders all cluster publishers (Property 6)
    - **Property 6: CoverageMap renders all cluster publishers**
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5**
    - Use `fc.record({ id: fc.integer(), total_sources: fc.integer({ min: 1, max: 10 }), publishers: fc.array(fc.record({ ... }), { minLength: 1 }) })`
    - File: `src/__tests__/components/CoverageMap.test.jsx`

  - [ ] 9.3 Create `src/components/news/NarrativePanel.jsx` — per-publisher rows with claims list and tone badge; highlights claims present in fewer than all articles (yellow background); clicking publisher name navigates to `/articles/:articleId`
    - _Requirements: 12.2, 12.3, 12.4, 12.5_

  - [ ]* 9.4 Write property test for NarrativePanel renders publisher claims and tone (Property 7)
    - **Property 7: NarrativePanel renders publisher claims and tone**
    - **Validates: Requirements 12.2, 12.3, 12.4**
    - Use `fc.record(ClusterDetail shape)` with overlapping/non-overlapping claim arrays
    - File: `src/__tests__/components/NarrativePanel.test.jsx`

  - [ ] 9.5 Create `src/components/news/LLMAnalysisPanel.jsx` — renders claims list, framing paragraph, tone badge, bias indicators list (hidden if empty); "Analysis unavailable" when `llmAnalysis` is null
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 9.6 Write property test for LLMAnalysisPanel renders all analysis fields (Property 5)
    - **Property 5: LLMAnalysisPanel renders all analysis fields**
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.5**
    - Use `fc.record({ claims: fc.array(fc.string()), framing: fc.string(), tone: fc.string(), bias_indicators: fc.array(fc.string()) })`
    - File: `src/__tests__/components/LLMAnalysisPanel.test.jsx`

  - [ ] 9.7 Create `src/components/news/CredibilityBreakdown.jsx` — renders publisher reputation contribution, misinfo risk contribution, matching sources count, single-source penalty notice (conditional on "Single Source" in `risk_indicators`), all `RiskTag` components with plain-language explanations
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [ ]* 9.8 Write property test for CredibilityBreakdown renders all score components (Property 8)
    - **Property 8: CredibilityBreakdown renders all score components**
    - **Validates: Requirements 15.2, 15.3, 15.4, 15.5**
    - Use `fc.record(ArticleDetail shape)` with `fc.option(fc.constant('Single Source'))` in `risk_indicators`
    - File: `src/__tests__/components/CredibilityBreakdown.test.jsx`

- [ ] 10. Layout shell
  - [ ] 10.1 Create `src/components/layout/Sidebar.jsx` — renders `DashboardPanel` or `DashboardLocked` based on auth state; renders `CategoryList` with 8 `NavLink` items to `/category/:name`; hover highlight via Tailwind; active category highlighted via NavLink `className` callback
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 4.1_

  - [ ] 10.2 Create `src/components/layout/TopNav.jsx` — GenNews logo linking to `/`; right side shows "Login" button (unauthenticated) or user email indicator (authenticated)
    - _Requirements: 1.2, 3.4, 4.6_

  - [ ] 10.3 Create `src/components/layout/MobileMenu.jsx` — hamburger toggle that shows/hides Sidebar on mobile
    - _Requirements: 1.3, 18.2_

  - [ ] 10.4 Create `src/components/layout/AppShell.jsx` — CSS Grid layout (sidebar 260px fixed | main flex-grow); renders `TopNav`, `Sidebar`, `MobileMenu`, and `<Outlet>`; collapses sidebar below 768px
    - _Requirements: 1.1, 1.3, 18.1, 18.2_

- [ ] 11. Pages
  - [ ] 11.1 Create `src/pages/LoginPage.jsx` — email + password inputs with associated `<label>` elements; "Login" submit button; client-side validation (email format via `isValidEmail`, non-empty password) before API call; calls `auth.login()`; redirects to `/` on success; inline error on failure; link back to Home_Page
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 20.3_

  - [ ]* 11.2 Write property test for login form rejects invalid email formats (Property 11)
    - **Property 11: Login form rejects invalid email formats**
    - **Validates: Requirements 7.5**
    - Use `fc.string()` filtered to strings not matching `[^@]+@[^@]+\.[^@]+`
    - File: `src/__tests__/pages/LoginPage.test.jsx`

  - [ ]* 11.3 Write property test for form inputs have associated labels (Property 16)
    - **Property 16: Form inputs have associated labels**
    - **Validates: Requirements 20.3**
    - Render LoginPage and AnalyzePage; assert every `<input>` and `<textarea>` has a matching `<label htmlFor>` or `aria-labelledby`
    - File: `src/__tests__/pages/LoginPage.test.jsx`

  - [ ] 11.4 Create `src/pages/HomePage.jsx` — renders `ArticleList` with data from `useArticles`; filter controls for category, publisher, credibility risk level; passes filter state as query params to hook; displays result count; infinite scroll via `useInfiniteScroll`
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 11.5 Write property test for filter parameters propagate to API calls (Property 9)
    - **Property 9: Filter parameters propagate to API calls**
    - **Validates: Requirements 6.2**
    - Use `fc.record({ category: fc.option(fc.string()), publisher: fc.option(fc.string()), riskLevel: fc.option(fc.string()) })` and assert Axios was called with matching params
    - File: `src/__tests__/pages/HomePage.test.jsx`

  - [ ] 11.6 Create `src/pages/CategoryPage.jsx` — reads `:categoryName` from route params; fetches articles with category filter; renders category name as `<h1>`; renders `ArticleList`; empty state when no articles; same pagination as Home_Page
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 11.7 Write property test for category heading matches route parameter (Property 17)
    - **Property 17: Category heading matches route parameter**
    - **Validates: Requirements 8.2**
    - Use `fc.constantFrom('politics', 'technology', 'health', 'business', 'sports', 'entertainment', 'science', 'world news')` and assert `<h1>` text matches
    - File: `src/__tests__/pages/CategoryPage.test.jsx`

  - [ ] 11.8 Create `src/pages/NewsPage.jsx` — fetches article via `useArticle`; fetches cluster via `useCluster` when `cluster_id` is non-null; renders title, publisher name (link), timestamp, category, cleaned text, `CredibilityBadge`, all `RiskTag` components, misinfo risk score + indicators, `LLMAnalysisPanel`, `CoverageMap`, `NarrativePanel`, `CredibilityBreakdown`; "No cluster data available" when no cluster
    - _Requirements: 9.1–9.7, 10.1–10.6, 11.1–11.6, 12.1–12.5, 15.1–15.6_

  - [ ]* 11.9 Write property test for News_Page renders all article metadata (Property 4)
    - **Property 4: News_Page renders all article metadata**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.6, 9.7**
    - Use `fc.record(ArticleDetail shape)` with arbitrary strings/numbers
    - File: `src/__tests__/pages/NewsPage.test.jsx`

  - [ ]* 11.10 Write property test for API error states are always shown (Property 14)
    - **Property 14: API error states are always shown**
    - **Validates: Requirements 17.1, 17.4**
    - Use `fc.integer({ min: 400, max: 599 })` to simulate HTTP errors; assert `<ErrorState>` is rendered
    - File: `src/__tests__/pages/NewsPage.test.jsx`

  - [ ] 11.11 Create `src/pages/PublisherPage.jsx` — fetches publisher via `usePublisher`; renders reputation score, total articles, list of recent `ArticleCard` components
    - _Requirements: 14.4, 14.5_

  - [ ]* 11.12 Write property test for publisher detail renders all required fields (Property 15)
    - **Property 15: Publisher detail renders all required fields**
    - **Validates: Requirements 14.5**
    - Use `fc.record({ id: fc.integer(), name: fc.string(), reputation_score: fc.float({ min: 0, max: 1 }), total_articles: fc.integer({ min: 0 }), recent_articles: fc.array(...) })`
    - File: `src/__tests__/pages/PublisherPage.test.jsx`

  - [ ] 11.13 Create `src/pages/AnalyzePage.jsx` — `AnalyzeForm` with textarea (article body), optional title/URL/publisher name inputs, all with associated `<label>` elements; validates non-empty text via `isNonEmptyText` and URL via `isValidUrl`; POSTs to `/api/articles/analyze`; disables submit + shows spinner while in-flight; renders full `AnalyzeResult` on success (score, verdict, risk indicators, LLM claims, matching sources); descriptive error on failure
    - _Requirements: 13.1–13.7, 20.3_

  - [ ]* 11.14 Write property test for Analyze form rejects whitespace-only text (Property 12)
    - **Property 12: Analyze form rejects whitespace-only text**
    - **Validates: Requirements 13.5**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n'))` and assert validation error is shown, API not called
    - File: `src/__tests__/pages/AnalyzePage.test.jsx`

  - [ ]* 11.15 Write property test for Analyze result renders all response fields (Property 13)
    - **Property 13: Analyze result renders all response fields**
    - **Validates: Requirements 13.4**
    - Use `fc.record(AnalyzeResult shape)` and assert all fields are rendered
    - File: `src/__tests__/pages/AnalyzePage.test.jsx`

  - [ ] 11.16 Create `src/pages/NotFoundPage.jsx` — "Page not found" message with link back to `/`
    - _Requirements: 16.6_

- [ ] 12. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Routing and app entry point
  - [ ] 13.1 Create `src/App.jsx` — wraps everything in `AuthProvider`; defines React Router routes: `/` → `HomePage`, `/login` → `LoginPage` (no AppShell), `/category/:categoryName` → `CategoryPage`, `/articles/:id` → `NewsPage`, `/publishers/:id` → `PublisherPage`, `/analyze` → `AnalyzePage`, `*` → `NotFoundPage`; all routes except `/login` wrapped in `AppShell`
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

  - [ ] 13.2 Update `src/main.jsx` — mount `<App />` with `<BrowserRouter>`
    - _Requirements: 16.1_

- [ ] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fc.assert(fc.property(...), { numRuns: 100 })` minimum
- Tag format for each property test: `// Feature: gennews-frontend, Property {N}: {property_text}`
- Unit tests cover happy path, error path, and edge cases not covered by property tests
- `clearCache()` must be called in `logout()` to prevent stale data leaking across sessions
