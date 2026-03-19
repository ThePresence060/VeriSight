import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArticleCard } from '../components/article/ArticleCard';
import { useSearch } from '../context/SearchContext';
import client from '../api/client';

export default function CategoryPage() {
  const { categoryName } = useParams();
  const { searchQuery, setSearchQuery } = useSearch();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSub, setActiveSub] = useState('All');

  // Capitalize category name for display
  const displayCategory = categoryName
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    : 'Category';

  const subCategories = {
    'politics': ['All', 'National', 'International', 'Policy', 'Elections'],
    'technology': ['All', 'AI', 'Gadgets', 'Cybersecurity', 'Software'],
    'world news': ['All', 'Asia', 'Europe', 'Americas', 'Africa'],
    'science': ['All', 'Space', 'Environment', 'Health', 'Physics']
  };

  const currentSubs = subCategories[categoryName?.toLowerCase()] || ['All', 'Latest', 'Popular', 'Trending'];

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        /**
         * BACKEND INTEGRATION:
         * Filter articles by category name and search query on the backend.
         */
        const params = {
          category: categoryName,
          page: 1,
          page_size: 48 // Increased to show older news
        };

        if (debouncedSearch) {
            params.search = debouncedSearch;
        }

        const res = await client.get('/api/articles', { params });
        setArticles(res.data.items || []);
      } catch (err) {
        console.error("Category fetch error:", err);
        setError(`Failed to load ${categoryName} news.`);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryData();
    setActiveSub('All'); // Reset sub when category changes
  }, [categoryName, debouncedSearch]);

  const filteredArticles = articles.filter(article => {
    // Search is now handled entirely by the backend, only filter by activeSub client-side
    const matchesSub = activeSub === 'All' || article.subCategory === activeSub;
    return matchesSub;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 capitalize tracking-wide">{displayCategory == "World News" ? "World" : displayCategory} News</h1>
          <p className="text-sm text-gray-400 font-medium tracking-wide">Latest stories and analysis in {categoryName}.</p>
        </div>

        {/* Sub-category Filter Pills */}
        {!loading && (
          <div className="flex flex-wrap gap-2">

          </div>
        )}
      </div>

      <section>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse bg-white/[0.04] h-36 rounded-2xl border border-white/[0.08]"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredArticles.length > 0 ? (
              filteredArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center glass-panel rounded-3xl">
                <div className="w-20 h-20 bg-white/[0.05] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No results found in {displayCategory}</h3>
                <p className="text-gray-400 max-w-md mx-auto">We couldn't find any articles matching your filters in this category. Try clearing your search or exploring other topics.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-8 px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
