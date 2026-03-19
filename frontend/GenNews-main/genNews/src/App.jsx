import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';

// Import our actual pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CategoryPage from './pages/CategoryPage';
import NewsPage from './pages/NewsPage';
import AnalyzePage from './pages/AnalyzePage';
import PublisherPage from './pages/PublisherPage';

// Basic empty page components for now, to be built out later if needed
function NotFoundPage() { return <div>404 - Not Found</div>; }

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Pages requiring AppShell */}
          <Route path="/" element={<AppShell><HomePage /></AppShell>} />
          <Route path="/category/:categoryName" element={<AppShell><CategoryPage /></AppShell>} />
          <Route path="/articles/:id" element={<AppShell><NewsPage /></AppShell>} />
          <Route path="/publishers/:id" element={<AppShell><PublisherPage /></AppShell>} />
          <Route path="/analyze" element={<AppShell><AnalyzePage /></AppShell>} />
          
          <Route path="*" element={<AppShell><NotFoundPage /></AppShell>} />
        </Routes>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
