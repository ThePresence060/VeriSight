# Tasks for GenNews Frontend

## Phase 1: Setup
- [ ] Initialize Vite + React project.
- [ ] Install Tailwind CSS, React Router, Axios, Lucide React (or other icon library).
- [ ] Structure the project into components, pages, and API handlers.

## Phase 2: Core Components 
- [ ] **Sidebar Component**: Displays Profile, Metrics, and Category List. Handles logged out locked state.
- [ ] **TopNav Component**: Displays GenNews logo and Login button / Profile.
- [ ] **AppShell Layout**: Combines Sidebar, TopNav, and main content area.

## Phase 3: Pages
- [ ] **Home Page**: Fetches and lists all news articles using reusable `ArticleCard` component.
- [ ] **Login Page**: Input for email and password, handling API auth.
- [ ] **Category Page**: Fetches and displays news based on selected category.
- [ ] **News Page**: Detailed article page integrating credibility score, claims, tones, and coverage map.

## Phase 4: API Integration
- [ ] Connect Axios endpoints to `http://localhost:8000` for fetching news, categories, metrics.
- [ ] Set up Authentication flow.

## Phase 5: Polish & Developer Experience
- [ ] Ensure CSS uses a consistent aesthetic design system.
- [ ] Add loading skeletons and error handling to ensure an excellent user experience. 
