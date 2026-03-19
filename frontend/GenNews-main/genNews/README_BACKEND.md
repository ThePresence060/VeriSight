# VeriSight: Backend Integration Guide

This document provides detailed instructions for backend developers (Python/FastAPI/Flask) to integrate with the VeriSight React frontend.

## 🚀 Getting Started

### 1. API Client Configuration
Open [client.js](file:///c:/Users/archi/OneDrive/Documents/hackathonFront-end/genNews/src/api/client.js) and update the `baseURL` to your local development or production server address.

```javascript
const client = axios.create({
  baseURL: 'http://your-backend-api.com', 
});
```

> [!IMPORTANT]
> Ensure **CORS** is enabled on your backend for `http://localhost:5173`.

---

## 🔐 Authentication Flow

The frontend uses Bearer Token authentication via an interceptor in `client.js`. 

### Expected Endpoints

#### 1. Login
- **Endpoint**: `POST /auth/login`
- **Request Body**: `{ "email": "...", "password": "..." }`
- **Expected Response**:
  ```json
  {
    "token": "JWT_TOKEN_HERE",
    "user": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "metrics": {
        "reliable_views": 150,
        "total_views": 400
      }
    }
  }
  ```

#### 2. Signup
- **Endpoint**: `POST /auth/register`
- **Request Body**: `{ "name": "...", "email": "...", "password": "..." }`
- **Expected Response**: Same as Login (or redirect to login).

---

## 📰 Content Delivery

### Home Page
Refer to [HomePage.jsx](file:///c:/Users/archi/OneDrive/Documents/hackathonFront-end/genNews/src/pages/HomePage.jsx).

- **Featured Articles**: `GET /articles/featured`
- **Trending Articles**: `GET /articles/trending`

### Categories
Refer to [CategoryPage.jsx](file:///c:/Users/archi/OneDrive/Documents/hackathonFront-end/genNews/src/pages/CategoryPage.jsx).

- **Category Feed**: `GET /articles/category/{category_name}`
- **Note**: The frontend supports sub-category filtering (e.g., Technology -> AI). Ensure your category endpoint can handle `?subCategory=...` or return a `subCategory` field in the article object.

### Article Details
Refer to [NewsPage.jsx](file:///c:/Users/archi/OneDrive/Documents/hackathonFront-end/genNews/src/pages/NewsPage.jsx).

- **Article Detail**: `GET /articles/{id}`
- **Analysis Data**: This endpoint (or a nested one) should return the AI analysis metrics:
  ```json
  {
    "id": "...",
    "title": "...",
    "reliability_score": 85,
    "depth_score": 70,
    "bias_score": -10,
    "claims": [
      { "text": "Claim 1...", "verified": true },
      { "text": "Claim 2...", "verified": false }
    ],
    "sources": [
      { "name": "BBC", "reliability": 0.9 },
      { "name": "Twitter", "reliability": 0.3 }
    ]
  }
  ```

---

## 📊 Dashboard & Metrics

The **Reliability Dashboard** in the sidebar expects a `metrics` object within the `user` state.

- **Location**: Managed in `AuthContext.jsx`.
- **Fields**:
  - `reliable_views`: Number of credible articles read.
  - `total_views`: Total articles read.

---

## 🛠️ Integration Anchors

I have placed `// BACKEND INTEGRATION:` comments in every file where an API call or data structure adjustment is required. 

**Search for this string in your IDE to find all specific locations:**
- `src/api/client.js` (Base URL)
- `src/context/AuthContext.jsx` (Login/Signup logic)
- `src/pages/HomePage.jsx` (Feeds)
- `src/pages/CategoryPage.jsx` (Categorized news)
- `src/pages/NewsPage.jsx` (Article loading)
- `src/components/news/AnalysisPanels.jsx` (AI Analysis data mapping)

---

## 💡 Best Practices
1. **Error Handling**: The frontend expects errors in the format `{ "detail": "Error message here" }` (FastAPI default).
2. **Skeleton Loaders**: The frontend has built-in skeleton loaders. It will display them automatically while the `loading` state is true.
3. **Drafts**: For "Add Article" functionality, map the frontend form to a `POST /articles` endpoint.
