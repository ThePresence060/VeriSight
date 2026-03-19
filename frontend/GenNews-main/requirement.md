# Requirements Document

## Introduction

GenNews Frontend is the user-facing web application for the GenNews AI-powered news credibility platform. It provides an interactive interface for browsing aggregated news, viewing AI-generated credibility scores, exploring story clusters, comparing publisher narratives, and submitting articles for manual analysis. The frontend communicates exclusively with the GenNews Backend_API (FastAPI, running on port 8000).

## UI Requirements based on images

- **Dashboard Layout:** A persistent left-side navigation panel (Sidebar) containing profile info, dashboard metrics, and category types.
- **Home Page (Logged Out):** When a user is not logged in, the dashboard metric area will show a lock sign and a small text below it saying "Sign in to start the metrics". The top right corner of the navigation bar will contain a login button. 
- **Login Page (`login.jpeg`):** A clean authentication page with fields for email, password, and a login button.
- **Category Page (`category-page.jpeg`):** When clicking on a category in the Sidebar, the app redirects to a page listing news specific to that category.
- **News Page (`news-page.png`):** Detailed view indicating credibility analysis, coverage map, full article text, credibility badges (using color codes), and narrative comparison across publishers.

## Core Application Shell
1. Consistent layout: Sidebar on the left, top navigation bar on the top. 
2. The Top navigation bar must contain a Login button or a user profile structure.

## Routing
- `/` - Home Page
- `/login` - Login Page
- `/category/:categoryName` - Category Page
- `/articles/:id` - News detail page
- `/publishers/:id` - Publisher detail page

## Responsiveness & Aesthetics
- Use modern aesthetics, rich gradients or plain but aesthetic UI.
- Use Vite + React + Vanilla CSS or TailwindCSS. Make sure it is developer-friendly, easily extensible, and well documented.

