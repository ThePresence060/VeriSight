import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/credibility';

export function ArticleCard({ article }) {
    const navigate = useNavigate();
    const [showTooltip, setShowTooltip] = useState(false);

    const score = article.credibility_score;
    const hasScore = score !== null && score !== undefined && !isNaN(score);
    const percentage = hasScore ? Math.round(score * 100) : null;
    const isReliable = hasScore && score >= 0.7;
    const reliabilityColor = !hasScore ? 'text-gray-500' : isReliable ? 'text-green-400' : score >= 0.3 ? 'text-yellow-400' : 'text-red-400';
    const reliabilityLabel = !hasScore ? 'Unscored' : isReliable ? 'High' : score >= 0.3 ? 'Medium' : 'Low';

    // Use real image_url from backend, fallback to picsum
    const imageUrl = article.image_url || `https://picsum.photos/seed/${article.id}/200/200`;

    // Defensive summary extraction
    const getSummary = () => {
        const framing = article.llm_analysis?.framing;
        if (framing && !framing.includes("Analysis failed") && !framing.includes("deferred")) {
            return framing;
        }
        const text = article.cleaned_text || article.original_text || "";
        if (text.length > 5) {
            // Clean up snippet markers if they leaked through
            const clean = text.replace(/\[\+\s*(\d+|,)+\s*char.*?\]/gi, '').trim();
            return clean.substring(0, 180) + (clean.length > 180 ? '...' : '');
        }
        return article.title;
    };
    const summary = getSummary();

    const isUserPost = article.publisher_name === "User Submitted";

    return (
        <article
            role="article"
            onClick={() => navigate(`/articles/${article.id}`)}
            className="bg-white/[0.03] rounded-2xl p-4 hover:bg-white/[0.06] transition-all cursor-pointer group flex items-center min-h-[160px] border border-white/[0.05] hover:border-white/20 shadow-sm relative z-0 hover:z-50"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Hover Tooltip - For All Articles */}
            {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl p-5 shadow-2xl pointer-events-none animate-in fade-in duration-200">
                    {/* Arrow */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a2e]/95 border-b border-r border-white/[0.12] rotate-45"></div>
                    
                    {/* Summary */}
                    <p className="text-[12px] text-gray-300 leading-relaxed font-light mt-1">
                        <span className="font-semibold text-cyan-400 block mb-1">AI Overview:</span>
                        {summary}
                    </p>

                    {/* Category + Publisher */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.08]">
                        <span className="text-[10px] text-gray-500 font-medium">{article.publisher_name}</span>
                        {article.category?.category && (
                            <>
                                <span className="text-gray-600">•</span>
                                <span className="text-[10px] text-gray-500 font-medium capitalize">{article.category.category}</span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Article Image */}
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-xl overflow-hidden mr-5 flex-shrink-0 bg-white/[0.05] relative shadow-inner">
                <img
                    src={imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = `https://picsum.photos/seed/${article.id}/200/200`; }}
                />
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors" />
            </div>

            <div className="flex flex-col justify-between flex-grow">
                <div>
                    <Link to={`/articles/${article.id}`} className="block">
                        <h2 className="text-[14px] font-bold text-gray-200 mb-1 leading-snug group-hover:text-white transition-colors line-clamp-2">
                            {article.title}
                        </h2>
                    </Link>
                    {isUserPost && (
                        <div className="text-[11px] text-gray-400 mb-2 font-medium flex items-center">
                            <span>Reliability: </span>
                            <span className={`ml-1 font-bold ${reliabilityColor}`}>
                                {hasScore ? `${percentage}% (${reliabilityLabel})` : 'Pending'}
                            </span>
                        </div>
                    )}
                    {/* Full Article Text with scrollbar */}
                    <div className="text-[11px] text-gray-400 leading-relaxed max-h-32 overflow-y-auto pr-2 custom-scrollbar mt-1 whitespace-pre-wrap">
                        {article.cleaned_text || article.original_text || article.title}
                    </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/5 text-[11px] text-gray-500 font-medium">
                    {formatRelativeTime(article.published_at)}
                </div>
            </div>
        </article>
    );
}

// A featured card variant like the ones shown at the top of the mockup
export function FeaturedArticleCard({ article, active }) {
    const navigate = useNavigate();
    const imageUrl = article.image_url || `https://picsum.photos/seed/${article.id + 100}/800/600`;

    return (
        <article
            className="relative w-full h-full cursor-pointer group"
            onClick={() => navigate(`/articles/${article.id}`)}
        >
            <img
                src={imageUrl}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => { e.target.src = `https://picsum.photos/seed/${article.id + 100}/800/600`; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-90" />

            <div className="absolute inset-x-0 bottom-0 p-5 z-10">
                <span className="text-xs font-medium text-gray-300 mb-1 block">
                    {article.publisher_name}
                </span>
                <h2 className={`font-bold text-white leading-tight ${active ? 'text-xl' : 'text-lg'}`}>
                    {article.title}
                </h2>
            </div>
        </article>
    );
}
