import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CredibilityBadge, RiskTag } from '../components/article/CredibilityBadge';
import { DashboardPanels } from '../components/news/AnalysisPanels';
import { generateDummyArticle, formatRelativeTime } from '../utils/credibility';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

// Helper: save article to recent visits in localStorage
function recordVisit(article) {
  try {
    const KEY = 'gennews_recent_visits';
    const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
    // Remove duplicate if already visited
    const filtered = existing.filter(a => a.id !== article.id);
    // Add to front
    filtered.unshift({
      id: article.id,
      title: article.title,
      publisher_name: article.publisher_name,
      image_url: article.image_url,
      visited_at: new Date().toISOString(),
    });
    // Keep last 10
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, 10)));
  } catch (e) {
    // localStorage might be unavailable
  }
}

export default function NewsPage() {
  const { id } = useParams();
  const { updateMetrics } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await client.get(`/api/articles/${id}`);
        const articleData = res.data;

        if (articleData.cluster_id) {
            try {
                const clusterRes = await client.get(`/api/clusters/${articleData.cluster_id}`);
                articleData.cluster_data = clusterRes.data;
            } catch (clusterErr) {
                console.warn("Could not fetch cluster data:", clusterErr);
            }
        } else {
            articleData.cluster_data = {
                coverage_map: [{
                    publisher: articleData.publisher_name,
                    reputation: 0.5,
                    article_id: articleData.id
                }]
            };
        }

        setArticle(articleData);
        recordVisit(articleData);
        updateMetrics(); 
      } catch (err) {
        console.error("Article fetch error:", err);
        setError("Could not load article detail.");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
        <div className="space-y-6 animate-pulse p-4">
            <div className="h-10 bg-white/[0.05] rounded w-3/4"></div>
            <div className="h-64 bg-white/[0.05] rounded-2xl border border-white/[0.08]"></div>
        </div>
    );
  }

  if (!article) return <div className="text-center py-10 text-slate-400">Article not found</div>;

  // Clean the article text
  const articleText = (article.cleaned_text || article.original_text || "").replace(/\[\+\s*(\d+|,)+\s*char.*?\]/gi, '').trim();
  const isSnippet = articleText.length < 500 && (article.cleaned_text || article.original_text || "").includes("[+");

  return (
    <div className="animate-in fade-in duration-500 p-2 md:p-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Article Content Panel */}
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 md:p-8 order-1">
               <div className="mb-6 border-b border-white/[0.08] pb-4">
                   <span className="text-sm font-semibold text-gray-300 mb-2 block tracking-wider">News Content</span>
                   <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug mb-4">{article.title}</h1>
                   
                   <div className="flex items-center text-[13px] text-gray-400 font-medium mb-6">
                       <span className="text-white bg-white/[0.08] px-2 py-0.5 rounded mr-3">{article.publisher_name}</span>
                       <span>{formatRelativeTime(article.published_at)}</span>
                   </div>
                   
                   {/* Article Image */}
                   <div className="w-full h-64 md:h-80 rounded-xl bg-white/[0.05] overflow-hidden mb-6 relative border border-white/[0.1]">
                       <img 
                           src={article.image_url || `https://picsum.photos/seed/${article.id + 500}/1200/600`} 
                           alt={article.title}
                           className="w-full h-full object-cover opacity-90"
                           onError={(e) => { e.target.src = `https://picsum.photos/seed/${article.id + 500}/1200/600`; }}
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80" />
                   </div>

                   {/* Full article body — no height limit, no scroll */}
                   <div className="prose prose-sm md:prose-base prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-line font-light">
                       {articleText}
                       {isSnippet && (
                           <p className="mt-4 text-orange-400/80 italic text-sm border-t border-orange-400/20 pt-2">
                               Note: Full content could not be retrieved from the source.
                           </p>
                       )}
                   </div>

                   {/* Source link */}
                   {article.url && !article.url.startsWith('user-submission') && (
                     <a 
                       href={article.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 hover:text-white transition-all"
                     >
                       <span>Read on source →</span>
                     </a>
                   )}
               </div>
            </div>

            {/* Right Sidebar Data: Scorecards */}
            <div className="lg:col-span-1 order-2">
                <DashboardPanels article={article} />
            </div>
        </div>
    </div>
  );
}
