import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { DashboardPanels } from '../components/news/AnalysisPanels';
import { CredibilityBadge } from '../components/article/CredibilityBadge';
import { useAuth } from '../context/AuthContext';

export default function AnalyzePage() {
    const navigate = useNavigate();
    const { isAuthenticated, user, updateMetrics } = useAuth();
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [publisher, setPublisher] = useState('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setResult(null);
        
        // Source URL is mandatory
        if (!url.trim()) {
            setError("Source URL is required. Please provide the original article link.");
            return;
        }

        if (!text.trim()) {
            setError("Please paste the article text for analysis.");
            return;
        }

        if (!title.trim()) {
            setError("Please provide the article headline / title.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                url: url.trim(),
                title: title.trim(),
                publisher_name: publisher.trim() || "User Submitted",
                text: text.trim(),
            };

            const res = await client.post('/api/articles/analyze', payload);
            let analysisData = res.data;

            // If a cluster was matched, fetch the cluster details to show the coverage map
            if (analysisData.cluster_id) {
                try {
                    const clusterRes = await client.get(`/api/clusters/${analysisData.cluster_id}`);
                    analysisData = {
                        ...analysisData,
                        cluster_data: clusterRes.data,
                    };
                } catch (ce) {
                    console.error("Failed to fetch cluster for coverage map", ce);
                }
            }

            setResult(analysisData);

            // Increment posts_made counter
            if (isAuthenticated) {
                try {
                    const currentMetrics = user?.metrics || {};
                    const updatedUser = {
                        ...user,
                        metrics: {
                            ...currentMetrics,
                            posts_made: (currentMetrics.posts_made || 0) + 1,
                        },
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    // Force a re-render via updateMetrics (it dispatches UPDATE_USER)
                    // We directly set it here since updateMetrics increments views
                    window.dispatchEvent(new Event('storage'));
                } catch (e) { /* silent */ }
            }

            // Also record in localStorage for the sidebar post history
            try {
                const userEmail = user?.email || 'guest';
                const KEY = `gennews_user_posts_${userEmail}`;
                const existing = JSON.parse(localStorage.getItem(KEY) || '[]');
                existing.unshift({
                    id: res.data.article_id,
                    title: res.data.title,
                    publisher_name: res.data.publisher_name,
                    verdict: res.data.verdict,
                    posted_at: new Date().toISOString(),
                });
                localStorage.setItem(KEY, JSON.stringify(existing.slice(0, 20)));
            } catch (e) { /* silent */ }

        } catch (err) {
            console.error("Analysis error:", err);
            const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
            if (isTimeout) {
                setError("Analysis is taking longer than expected. The AI model may still be loading. Please try again in a moment.");
            } else {
                setError(err.response?.data?.detail || err.message || "Failed to analyze the article. Make sure the backend is running.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-3">Post & Analyze News</h1>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Submit a news article with its source link. Our AI engine will verify credibility, 
                    analyze framing, detect bias, and cross-reference with known sources.
                </p>
            </div>

            {!result && (
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-white/[0.08] max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-medium border border-red-500/20 flex items-start">
                                <span className="mr-3">⚠️</span> {error}
                            </div>
                        )}
                        
                        {/* Source URL — MANDATORY */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Source URL <span className="text-rose-400">* Required</span>
                            </label>
                            <input
                                type="url"
                                required
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/news-article..."
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/30"
                            />
                            <p className="text-[10px] text-gray-600 mt-1">Original article link is required for verification</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Article Title <span className="text-rose-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Headline of the article"
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Publisher Name</label>
                                <input
                                    type="text"
                                    value={publisher}
                                    onChange={(e) => setPublisher(e.target.value)}
                                    placeholder="e.g. The New York Times"
                                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Article Text <span className="text-rose-400">*</span>
                            </label>
                            <textarea
                                required
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={8}
                                placeholder="Paste the full text of the article here for analysis..."
                                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                            ></textarea>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-white/[0.08]">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-white text-black font-bold uppercase tracking-wider text-sm rounded-full hover:bg-gray-200 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Analyzing...
                                    </>
                                ) : "Post & Analyze"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading && !result && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xl font-bold text-white mb-2">AI is evaluating the content</h3>
                    <p className="text-gray-400 text-sm">Processing semantic claims, cross-referencing sources, and determining framing bias...</p>
                </div>
            )}

            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
                        <button 
                            onClick={() => { setResult(null); setUrl(''); setTitle(''); setPublisher(''); setText(''); }}
                            className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-sm text-gray-300 transition-colors cursor-pointer"
                        >
                            Post Another
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div className="glass-panel p-6 rounded-2xl border border-white/[0.08]">
                            <div className="flex items-center gap-3 mb-4">
                                <CredibilityBadge score={result.credibility_score || (1 - result.misinfo_risk_score)} verdict={result.verdict} />
                                <span className="text-sm text-gray-400 font-medium">Confidence: {Math.round(result.confidence * 100)}%</span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2">{result.title}</h3>
                            <p className="text-sm text-gray-400 mb-6 border-b border-white/[0.08] pb-4">
                                Published by <span className="text-gray-200">{result.publisher_name}</span> 
                                {result.category && <span> • Category: <span className="capitalize text-gray-200">{result.category.category}</span></span>}
                            </p>

                            {result.is_high_risk && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                                    <h4 className="text-red-400 font-bold text-sm mb-2 flex items-center">
                                        <span className="mr-2">🚨</span> High Misinformation Risk Detected
                                    </h4>
                                    <ul className="list-disc list-inside text-sm text-red-300/80 space-y-1">
                                        {result.misinfo_indicators.map((ind, i) => (
                                            <li key={i}>{ind}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">AI Framing Summary</h4>
                                <p className="text-sm text-gray-300 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                                    {result.llm_analysis?.framing || "No framing analysis available."}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-white/[0.08] pt-8">
                            <DashboardPanels 
                                article={{
                                    publisher_name: "User Submitted",
                                    credibility_score: result.credibility_score || (1 - result.misinfo_risk_score),
                                    misinfo_risk_score: result.misinfo_risk_score,
                                    misinfo_indicators: result.misinfo_indicators,
                                    is_high_risk: result.is_high_risk,
                                    llm_analysis: result.llm_analysis,
                                    cluster_data: result.cluster_data || null
                                }} 
                                isGrid={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
