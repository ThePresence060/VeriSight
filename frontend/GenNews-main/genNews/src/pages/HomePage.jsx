import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleCard, FeaturedArticleCard } from '../components/article/ArticleCard';
import { generateDummyArticle } from '../utils/credibility';
import { useSearch } from '../context/SearchContext';
import client from '../api/client';

export default function HomePage() {
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchHomeData = async () => {
        setLoading(true);
        try {
            // Fetch latest articles from the backend with search queries
            // Use larger page_size so older posts are visible
            const feedParams = { page_size: 48, page: 1 };
            const featuredParams = { page_size: 3, page: 1 };
            
            if (debouncedSearch) {
                feedParams.search = debouncedSearch;
                featuredParams.search = debouncedSearch;
            }

            const [featuredRes, feedRes] = await Promise.all([
                client.get('/api/articles', { params: featuredParams }),
                client.get('/api/articles', { params: feedParams }),
            ]);

            // Use the first 3 as featured, and all for the grid
            setFeatured(featuredRes.data.items.slice(0, 3));
            setArticles(feedRes.data.items);
        } catch (err) {
            console.error("Home data fetch error:", err);
            setError("Failed to load news. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    fetchHomeData();
  }, [debouncedSearch]);

  const filteredArticles = articles;
  const filteredFeatured = featured;

  const nextSlide = () => {
      setActiveIndex((prev) => (prev + 1) % featured.length);
  };
  const prevSlide = () => {
      setActiveIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      
       {/* Featured Articles Carousel Section */}
      {filteredFeatured.length > 0 && (
        <section className="relative w-full max-w-6xl mx-auto py-4">
            {loading ? (
                <div className="flex space-x-6 overflow-hidden justify-center">
                    <div className="w-[30%] h-56 bg-white/[0.04] rounded-[2rem] animate-pulse border border-white/[0.08] opacity-50 scale-90"></div>
                    <div className="w-[40%] h-56 bg-white/[0.04] rounded-[2rem] animate-pulse border border-white/[0.08] scale-100 z-10"></div>
                    <div className="w-[30%] h-56 bg-white/[0.04] rounded-[2rem] animate-pulse border border-white/[0.08] opacity-50 scale-90"></div>
                </div>
            ) : (
                <div className="relative flex items-center justify-center">
                    {/* Left Button */}
                    <button 
                        onClick={prevSlide}
                        className="absolute left-0 z-20 p-2 text-white bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-md hidden md:block"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    {/* Carousel Track */}
                    <div className="flex items-center justify-center w-full relative h-64 overflow-hidden">
                        {filteredFeatured.map((article, index) => {
                            let position = "translate-x-[200%] opacity-0"; // hidden right
                            let zIndex = 0;
                            let scale = "scale-75";
                            
                            const displayIndex = index;
                            const activeDisplayIndex = activeIndex % filteredFeatured.length;

                            if (displayIndex === activeDisplayIndex) {
                                position = "translate-x-0 opacity-100"; // center
                                zIndex = 10;
                                scale = "scale-100";
                            } else if (displayIndex === (activeDisplayIndex - 1 + filteredFeatured.length) % filteredFeatured.length) {
                                position = "-translate-x-[60%] md:-translate-x-[110%] opacity-60"; // left
                                zIndex = 5;
                                scale = "scale-90";
                            } else if (displayIndex === (activeDisplayIndex + 1) % filteredFeatured.length) {
                                position = "translate-x-[60%] md:translate-x-[110%] opacity-60"; // right
                                zIndex = 5;
                                scale = "scale-90";
                            }

                            return (
                                <div 
                                    key={article.id} 
                                    className={`absolute transition-all duration-500 ease-in-out cursor-pointer ${position} ${scale}`}
                                    style={{ zIndex }}
                                    onClick={() => {
                                        if (displayIndex === activeDisplayIndex) {
                                            navigate(`/articles/${article.id}`);
                                        } else {
                                            setActiveIndex(displayIndex);
                                        }
                                    }}
                                >
                                    <div className={`w-[260px] md:w-[400px] h-[180px] md:h-[220px] rounded-[2rem] overflow-hidden ${displayIndex === activeDisplayIndex ? "ring-2 ring-white/50 shadow-[0_0_30px_rgba(255,255,255,0.15)]" : "ring-1 ring-white/10"}`}>
                                        <FeaturedArticleCard article={article} active={displayIndex === activeDisplayIndex} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Button */}
                    <button 
                        onClick={nextSlide}
                        className="absolute right-0 z-20 p-2 text-white bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-md hidden md:block"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            )}

            {/* Dots */}
            {!loading && filteredFeatured.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                    {filteredFeatured.map((_, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setActiveIndex(idx)}
                            className={`h-1.5 rounded-full transition-all ${idx === (activeIndex % filteredFeatured.length) ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`}
                        />
                    ))}
                </div>
            )}
        </section>
      )}

       {/* Trending News Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-gray-300 tracking-wide">
                {searchQuery ? `Search results for "${searchQuery}"` : 'Trending news'}
            </h2>
            {searchQuery && (
                <p className="text-sm text-gray-500">{filteredArticles.length} results found</p>
            )}
        </div>
        
        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse bg-white/[0.04] h-36 rounded-2xl border border-white/[0.08]"></div>
            ))}
            </div>
        ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-3xl">
                <div className="w-20 h-20 bg-white/[0.05] rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No matching news found</h3>
                <p className="text-gray-400 max-w-md mx-auto">We couldn't find any articles related to your search. Try different keywords or check out our active categories.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-8 px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all"
                >
                  Clear search
                </button>
            </div>
        )}
      </section>

    </div>
  );
}
