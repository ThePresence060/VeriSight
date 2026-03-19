# Requirements Document

## Introduction

GenNews Frontend is the user-facing web application for the GenNews AI-powered news credibility platform. It provides an interactive interface for browsing aggregated news, viewing AI-generated credibility scores, exploring story clusters, comparing publisher narratives, and submitting articles for manual analysis. The frontend communicates exclusively with the GenNews Backend_API (FastAPI, running on port 8000) and is designed around five core pages: Home (dashboard), Login, Category, News Article, and implicitly the Publishers view. Authentication gates access to dashboard metrics, while unauthenticated users can still browse headlines and credibility indicators.

## Glossary

- **Frontend_App**: The GenNews web application delivered to the user's browser
- **Sidebar**: The persistent left-side navigation panel containing profile info, dashboard metrics, and category list
- **Dashboard**: The collapsible metrics panel within the Sidebar showing platform-wide statistics
- **Category_List**: The list of topic categories displayed in the Sidebar (politics, technology, health, business, sports, entertainment, science, world news)
- **Home_Page**: The main landing page showing the news feed alongside the Sidebar
- **Login_Page**: The authentication page with email and password fields
- **Category_Page**: A filtered news list page showing articles belonging to a selected category
- **News_Page**: The full article detail page showing credibility analysis, coverage map, and narrative comparison
- **Article_Card**: A compact summary card representing a single article in a list view
- **Credibility_Badge**: A visual indicator (color-coded score + verdict label) shown on Article_Cards and the News_Page
- **Coverage_Map**: A visual panel on the News_Page showing all publishers reporting on the same story cluster
- **Narrative_Panel**: A panel on the News_Page comparing key claims and tone across publishers in a cluster
- **Risk_Tag**: A small label indicating a specific credibility risk (e.g., "Single Source", "High Misinformation Risk")
- **Verdict_Label**: A text label summarizing the credibility verdict ("Likely Credible", "Needs Verification", "Potentially Unreliable")
- **Analyze_Form**: The form allowing users to paste article text for on-demand credibility analysis via POST /api/articles/analyze
- **Backend_API**: The FastAPI service exposing all news data at http://localhost:8000
- **Auth_State**: The client-side record of whether the user is currently authenticated
- **Locked_State**: The visual state of the Dashboard when Auth_State is unauthenticated, showing a lock icon and sign-in prompt

## Requirements

### Requirement 1: Application Shell and Layout

**User Story:** As a user, I want a consistent layout across all pages, so that navigation feels familiar and predictable.

#### Acceptance Criteria

1. THE Frontend_App SHALL render a persistent Sidebar on the left side of every page
2. THE Frontend_App SHALL render a top navigation bar containing the application logo and, on the right side, either a login button (unauthenticated) or a user profile indicator (authenticated)
3. WHEN the viewport width is below 768px, THE Frontend_App SHALL collapse the Sidebar into a hamburger-menu toggle
4. THE Frontend_App SHALL load the initial page layout within 3 seconds on a standard broadband connection
5. THE Frontend_App SHALL display a loading skeleton while data is being fetched from the Backend_API

### Requirement 2: Sidebar — Category Navigation

**User Story:** As a user, I want to browse news by topic category from the sidebar, so that I can quickly find stories relevant to my interests.

#### Acceptance Criteria

1. THE Sidebar SHALL display the Category_List with all supported categories: politics, technology, health, business, sports, entertainment, science, and world news
2. WHEN a user clicks a category in the Category_List, THE Frontend_App SHALL navigate to the Category_Page for that category
3. WHEN a user hovers over a category in the Category_List, THE Sidebar SHALL apply a visible highlight style to that category item
4. THE Sidebar SHALL visually indicate the currently active category when the user is on a Category_Page

### Requirement 3: Sidebar — Dashboard Metrics (Locked State)

**User Story:** As an unauthenticated visitor, I want to see that dashboard metrics exist but require login, so that I understand the value of signing in.

#### Acceptance Criteria

1. WHILE Auth_State is unauthenticated, THE Sidebar SHALL display the Dashboard in Locked_State
2. WHILE Auth_State is unauthenticated, THE Dashboard SHALL display a lock icon alongside the text "Sign in to start the metrics"
3. WHILE Auth_State is unauthenticated, THE Dashboard SHALL NOT display any platform statistics or metric values
4. WHILE Auth_State is unauthenticated, THE top navigation bar SHALL display a "Login" button in the top-right corner

### Requirement 4: Sidebar — Dashboard Metrics (Authenticated State)

**User Story:** As an authenticated user, I want to see platform-wide statistics in the dashboard, so that I can understand the scope and health of the platform.

#### Acceptance Criteria

1. WHILE Auth_State is authenticated, THE Dashboard SHALL fetch platform statistics from GET /api/stats
2. WHILE Auth_State is authenticated, THE Dashboard SHALL display the total number of articles analyzed
3. WHILE Auth_State is authenticated, THE Dashboard SHALL display the number of active story clusters
4. WHILE Auth_State is authenticated, THE Dashboard SHALL display the number of tracked publishers
5. WHEN the Dashboard data fetch fails, THE Dashboard SHALL display an error message and a retry option
6. WHILE Auth_State is authenticated, THE top navigation bar SHALL display the user's profile indicator instead of the login button

### Requirement 5: Home Page — News Feed

**User Story:** As a user, I want to see a feed of recent news articles on the home page, so that I can stay informed about current events.

#### Acceptance Criteria

1. WHEN the Home_Page loads, THE Frontend_App SHALL fetch articles from GET /api/articles and display them as Article_Cards
2. THE Home_Page SHALL display at least 20 Article_Cards per page load
3. WHEN the user scrolls to the bottom of the article list, THE Frontend_App SHALL fetch the next page of articles from GET /api/articles and append them to the list
4. EACH Article_Card SHALL display the article title, publisher name, publication timestamp, category label, and Credibility_Badge
5. WHEN a user clicks an Article_Card, THE Frontend_App SHALL navigate to the News_Page for that article

### Requirement 6: Home Page — Article Filtering

**User Story:** As a user, I want to filter the home page news feed, so that I can narrow results to what matters to me.

#### Acceptance Criteria

1. THE Home_Page SHALL provide filter controls for category, publisher, and credibility risk level
2. WHEN a filter is applied, THE Frontend_App SHALL pass the corresponding query parameters to GET /api/articles and refresh the article list
3. WHEN filter results are updated, THE Frontend_App SHALL display the count of matching articles
4. WHEN search or filter criteria are applied, THE Frontend_App SHALL update the displayed results within 2 seconds

### Requirement 7: Login Page

**User Story:** As a visitor, I want to log in with my email and password, so that I can access gated dashboard features.

#### Acceptance Criteria

1. THE Login_Page SHALL display an email input field and a password input field
2. THE Login_Page SHALL display a submit button labeled "Login" or "Sign In"
3. WHEN the user submits the login form with valid credentials, THE Frontend_App SHALL update Auth_State to authenticated and redirect to the Home_Page
4. WHEN the user submits the login form with invalid credentials, THE Frontend_App SHALL display an inline error message without navigating away
5. WHEN the email field contains a value that is not a valid email format, THE Frontend_App SHALL display a validation error before submitting the form
6. WHEN the password field is empty on submit, THE Frontend_App SHALL display a validation error before submitting the form
7. THE Login_Page SHALL provide a visible link or button to return to the Home_Page without logging in

### Requirement 8: Category Page

**User Story:** As a user, I want to view a filtered list of articles for a specific category, so that I can explore news within a topic area.

#### Acceptance Criteria

1. WHEN the Category_Page loads, THE Frontend_App SHALL fetch articles from GET /api/articles with the selected category as a filter parameter
2. THE Category_Page SHALL display the category name as a page heading
3. THE Category_Page SHALL display matching articles as Article_Cards with the same fields as the Home_Page feed
4. WHEN no articles exist for the selected category, THE Category_Page SHALL display an empty-state message indicating no articles are available
5. WHEN a user clicks an Article_Card on the Category_Page, THE Frontend_App SHALL navigate to the News_Page for that article
6. THE Category_Page SHALL support the same pagination behavior as the Home_Page

### Requirement 9: News Page — Article Detail

**User Story:** As a user, I want to read the full details of a news article including its credibility analysis, so that I can make an informed judgment about the story.

#### Acceptance Criteria

1. WHEN the News_Page loads, THE Frontend_App SHALL fetch the article from GET /api/articles/{id}
2. THE News_Page SHALL display the article title, publisher name, publication timestamp, and category
3. THE News_Page SHALL display the full cleaned article text
4. THE News_Page SHALL display the Credibility_Badge showing the credibility score (0.0–1.0) and Verdict_Label
5. THE Credibility_Badge SHALL use color encoding: green for scores ≥ 0.7 ("Likely Credible"), yellow for scores between 0.3 and 0.69 ("Needs Verification"), and red for scores below 0.3 ("Potentially Unreliable")
6. THE News_Page SHALL display all Risk_Tags associated with the article (e.g., "Single Source", "High Misinformation Risk", "Low Publisher Reputation", "Narrative Inconsistency")
7. THE News_Page SHALL display the misinformation risk score and the list of misinformation indicators returned by the Backend_API

### Requirement 10: News Page — LLM Analysis Panel

**User Story:** As a user, I want to see the AI-extracted claims, tone, and bias indicators for an article, so that I can understand the content beyond the headline.

#### Acceptance Criteria

1. THE News_Page SHALL display a dedicated LLM analysis section
2. THE News_Page SHALL list the key claims extracted by the LLM_Analyzer
3. THE News_Page SHALL display the narrative framing description from the LLM_Analyzer
4. THE News_Page SHALL display the detected emotional tone (e.g., neutral, alarming, positive)
5. WHEN bias indicators are present, THE News_Page SHALL list each bias indicator
6. WHEN LLM analysis data is absent for an article, THE News_Page SHALL display a message indicating analysis is unavailable for this article

### Requirement 11: News Page — Coverage Map

**User Story:** As a user, I want to see which publishers are covering the same story, so that I can assess how widely a story has been reported.

#### Acceptance Criteria

1. WHEN the article belongs to a Story_Cluster, THE News_Page SHALL fetch cluster data from GET /api/clusters/{id} and display the Coverage_Map
2. THE Coverage_Map SHALL list all publishers reporting on the same story cluster
3. THE Coverage_Map SHALL display the Publisher_Reputation score for each publisher in the cluster
4. THE Coverage_Map SHALL visually distinguish the identified original source from subsequent coverage
5. THE Coverage_Map SHALL display the total number of sources covering the story
6. WHEN the article does not belong to any cluster, THE News_Page SHALL display a "No cluster data available" message in place of the Coverage_Map

### Requirement 12: News Page — Narrative Comparison Panel

**User Story:** As a user, I want to compare how different publishers frame the same story, so that I can identify differences in perspective and potential bias.

#### Acceptance Criteria

1. WHEN cluster data is available, THE News_Page SHALL display the Narrative_Panel
2. THE Narrative_Panel SHALL show the key claims from each article in the cluster, grouped by publisher
3. THE Narrative_Panel SHALL visually highlight claims that appear in some articles but not others
4. THE Narrative_Panel SHALL display the emotional tone for each publisher's article
5. WHEN a user clicks on a publisher entry in the Narrative_Panel, THE Frontend_App SHALL navigate to the News_Page for that publisher's article

### Requirement 13: Article Submission — Analyze Form

**User Story:** As a user, I want to paste article text and receive an instant credibility analysis, so that I can check any article I encounter online.

#### Acceptance Criteria

1. THE Frontend_App SHALL provide an Analyze_Form accessible from the Home_Page or a dedicated route
2. THE Analyze_Form SHALL include a large text area for article body, and optional fields for title, URL, and publisher name
3. WHEN the user submits the Analyze_Form, THE Frontend_App SHALL POST the data to /api/articles/analyze
4. WHEN the analysis response is received, THE Frontend_App SHALL display the full analysis result including credibility score, verdict, risk indicators, LLM claims, and matching sources count
5. WHEN the text area is empty on submit, THE Frontend_App SHALL display a validation error and prevent submission
6. WHILE the analysis request is in progress, THE Frontend_App SHALL display a loading indicator and disable the submit button to prevent duplicate submissions
7. WHEN the Backend_API returns an error for the analysis request, THE Frontend_App SHALL display a descriptive error message to the user

### Requirement 14: Publisher Reputation Display

**User Story:** As a user, I want to see the reputation score of a publisher, so that I can factor source reliability into my judgment.

#### Acceptance Criteria

1. THE Frontend_App SHALL display the Publisher_Reputation score alongside the publisher name on Article_Cards and the News_Page
2. THE Frontend_App SHALL fetch publisher data from GET /api/publishers when rendering publisher reputation details
3. THE Publisher_Reputation score SHALL use the same color encoding as the Credibility_Badge (green ≥ 0.7, yellow 0.3–0.69, red < 0.3)
4. WHEN a user clicks on a publisher name, THE Frontend_App SHALL navigate to a publisher detail view fetched from GET /api/publishers/{id}
5. THE publisher detail view SHALL display the publisher's reputation score, total articles tracked, and a list of recent articles

### Requirement 15: Credibility Score Transparency

**User Story:** As a user, I want to understand what factors contributed to a credibility score, so that I can make an informed judgment rather than blindly trusting a number.

#### Acceptance Criteria

1. THE News_Page SHALL display a breakdown section explaining the credibility score components
2. THE breakdown section SHALL show the publisher reputation contribution
3. THE breakdown section SHALL show the misinformation risk contribution
4. THE breakdown section SHALL show the source diversity (number of matching sources)
5. WHEN a single-source penalty was applied, THE breakdown section SHALL indicate that the score was reduced due to single-source reporting
6. THE breakdown section SHALL display all active Risk_Tags with a plain-language explanation for each

### Requirement 16: Routing and Navigation

**User Story:** As a user, I want browser navigation (back/forward buttons and shareable URLs) to work correctly, so that I can navigate the app naturally.

#### Acceptance Criteria

1. THE Frontend_App SHALL implement client-side routing with distinct URL paths for each page
2. THE Home_Page SHALL be accessible at the root path "/"
3. THE Login_Page SHALL be accessible at "/login"
4. THE Category_Page SHALL be accessible at "/category/{category_name}"
5. THE News_Page SHALL be accessible at "/articles/{id}"
6. WHEN a user navigates to an unknown route, THE Frontend_App SHALL display a 404 not-found page with a link back to the Home_Page
7. WHEN a user presses the browser back button, THE Frontend_App SHALL return to the previous page without a full page reload

### Requirement 17: API Error Handling

**User Story:** As a user, I want clear feedback when something goes wrong, so that I'm not left staring at a blank screen.

#### Acceptance Criteria

1. WHEN any Backend_API request returns a 4xx or 5xx status, THE Frontend_App SHALL display a user-friendly error message
2. WHEN the Backend_API is unreachable, THE Frontend_App SHALL display a connection error message and offer a retry action
3. WHEN a GET /api/articles/{id} request returns 404, THE Frontend_App SHALL display an "Article not found" message and a link to the Home_Page
4. IF a data fetch fails on initial page load, THEN THE Frontend_App SHALL display an error state rather than an empty or broken layout

### Requirement 18: Responsive Design

**User Story:** As a user on a mobile device, I want the interface to be usable on smaller screens, so that I can check news credibility on the go.

#### Acceptance Criteria

1. THE Frontend_App SHALL render correctly on viewport widths from 320px to 1920px
2. WHEN the viewport width is below 768px, THE Frontend_App SHALL stack the Sidebar and main content vertically
3. THE Article_Card layout SHALL reflow to a single-column list on viewports below 768px
4. THE Coverage_Map and Narrative_Panel SHALL remain readable and scrollable on viewports below 768px

### Requirement 19: Performance

**User Story:** As a user, I want pages to load quickly, so that I'm not waiting around for news I could read elsewhere.

#### Acceptance Criteria

1. THE Frontend_App SHALL load the initial Home_Page within 3 seconds on a standard broadband connection
2. WHEN navigating between pages via client-side routing, THE Frontend_App SHALL render the new page within 1 second
3. THE Frontend_App SHALL not make redundant API requests for data already fetched during the current session
4. WHEN fetching paginated article lists, THE Frontend_App SHALL request only the next page rather than re-fetching all previous pages

### Requirement 20: Accessibility

**User Story:** As a user with assistive technology, I want the interface to be navigable by keyboard and screen reader, so that the platform is inclusive.

#### Acceptance Criteria

1. THE Frontend_App SHALL provide descriptive alt text for all non-decorative images and icons
2. THE Frontend_App SHALL ensure all interactive elements (buttons, links, form fields) are reachable via keyboard Tab navigation
3. THE Frontend_App SHALL associate form labels with their corresponding input fields using semantic HTML
4. THE Credibility_Badge SHALL convey its meaning through text or aria-label in addition to color, so that color-blind users receive the same information
5. THE Frontend_App SHALL maintain a visible focus indicator on all interactive elements during keyboard navigation
