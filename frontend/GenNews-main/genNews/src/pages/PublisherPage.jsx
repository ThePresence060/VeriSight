import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { ArticleCard } from '../components/article/ArticleCard';
import { getCredibilityColor, getCredibilityLabel } from '../utils/credibility';

export default function PublisherPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [publisher, setPublisher] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPublisher = async () => {
            setLoading(true);
            try {
                const res = await client.get(`/api/publishers/${id}`);
                setPublisher(res.data);
            } catch (err) {
                console.error("Publisher fetch error:", err);
                setError("Could not load publisher details.");
            } finally {
                setLoading(false);
            }
        };
        fetchPublisher();
    }, [id]);

    if (loading) {
        return (
            <div className="animate-pulse p-4 space-y-8 max-w-5xl mx-auto">
                <div className="h-32 bg-white/[0.05] rounded-3xl border border-white/[0.08]"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/[0.05] rounded-2xl"></div>)}
                </div>
            </div>
        );
    }

    if (error || !publisher) {
        return (
            <div className="text-center py-20">
                <div className="w-16 h-16 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h2 className="text-xl text-white font-bold mb-2">Publisher Not Found</h2>
                <p className="text-gray-400 mb-6">{error || "The requested publisher doesn't exist."}</p>
                <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    const { name, reputation_score, article_count, recent_articles } = publisher;
    const isReliable = reputation_score >= 0.7;
    const percentage = Math.round(reputation_score * 100);

    return (
        <div className="animate-in fade-in duration-500 max-w-6xl mx-auto p-4 md:p-6">
            
            {/* Publisher Header Card */}
            <div className="glass-panel p-8 rounded-3xl border border-white/[0.08] mb-10 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="flex-1 text-center md:text-left z-10">
                    <div className="inline-flex items-center px-3 py-1 bg-white/[0.05] border border-white/[0.1] rounded-full text-xs text-gray-400 uppercase tracking-widest font-bold mb-4">
                        News Publisher
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">{name}</h1>
                    <p className="text-gray-400 flex items-center justify-center md:justify-start gap-4">
                        <span><strong className="text-gray-200">{article_count}</strong> articles indexed</span>
                    </p>
                </div>

                {/* Reputation Gauge */}
                <div className="z-10 flex flex-col items-center justify-center p-6 bg-white/[0.03] rounded-2xl border border-white/[0.05] min-w-[200px]">
                    <div className="text-center mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Overall Reputation</span>
                    </div>
                    <div className="flex items-end gap-1 mb-2">
                        <span className={`text-4xl font-black leading-none ${isReliable ? 'text-green-400' : reputation_score >= 0.3 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {percentage}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden mb-3">
                        <div 
                            className={`h-full rounded-full ${isReliable ? 'bg-green-500' : reputation_score >= 0.3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isReliable ? 'text-green-500' : reputation_score >= 0.3 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {isReliable ? 'Highly Reliable' : reputation_score >= 0.3 ? 'Mixed Reliability' : 'Low Reliability'}
                    </span>
                </div>
            </div>

            {/* Recent Articles */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white relative pl-4">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-full"></span>
                        Recent Coverage
                    </h2>
                </div>

                {recent_articles && recent_articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                        {recent_articles.map(article => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                ) : (
                    <div className="glass-panel p-10 text-center rounded-2xl">
                        <p className="text-gray-400">No recent articles found for this publisher.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
