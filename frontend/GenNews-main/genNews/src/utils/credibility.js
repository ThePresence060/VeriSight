// Dark mode credibility text styling mappings
export function getCredibilityColor(score) {
  if (score >= 0.7) {
    return "bg-white/10 text-white border-white/20";
  }
  if (score >= 0.3) {
    return "bg-white/[0.05] text-gray-400 border-white/10";
  }
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

export function getCredibilityLabel(score) {
  if (score >= 0.7) return "HIGH RELIABILITY";
  if (score >= 0.3) return "MEDIUM RELIABILITY";
  return "LOW RELIABILITY";
}

// Example dummy data generator for rapid prototyping since we don't have the backend up yet
export const generateDummyArticle = (id) => {
  // Simple deterministic pseudo-random logic based on ID
  const seedScore = ((id * 13) % 100) / 100;
  const stableScore = (0.3 + (seedScore * 0.65)).toFixed(2);
  
  return {
    id,
    title: `News Dummy Article ${id} about important world events`,
    publisher_name: ['Slewe News', 'GMA', 'Global Media', 'TechCrunch'][id % 4],
    publisher_id: id % 4 + 1,
    published_at: new Date(Date.now() - id * 3600000).toISOString(),
    category: ['politics', 'technology', 'world news', 'science'][id % 4],
    credibility_score: parseFloat(stableScore),
    verdict: stableScore >= 0.7 ? 'High Reliability' : 'Medium Reliability',
    risk_indicators: id % 3 === 0 ? ['Single Source'] : [],
    publisher_reputation: 0.5 + ((id % 5) * 0.1),
  }
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
