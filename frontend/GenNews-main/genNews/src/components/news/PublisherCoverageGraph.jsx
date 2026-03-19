import React from 'react';

export function PublisherCoverageGraph({ coverageMap }) {
  if (!coverageMap || coverageMap.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-white/5 bg-white/[0.01]">
        <div className="text-3xl mb-2 opacity-20">📰</div>
        <div className="text-gray-500 text-xs font-medium uppercase tracking-widest text-center">
            No other platforms found
        </div>
      </div>
    );
  }

  // Deduplicate publishers
  const seen = new Set();
  const publishers = coverageMap.filter(item => {
    const pub = item.publisher || 'Unknown';
    if (seen.has(pub)) return false;
    seen.add(pub);
    return true;
  });

  // Helper to get logo URL
  const getLogoUrl = (name) => {
    const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let domain = `${clean}.com`;
    if (clean.includes('nyt') || clean.includes('newyorktimes')) domain = 'nytimes.com';
    if (clean.includes('bbc')) domain = 'bbc.co.uk';
    if (clean.includes('cnn')) domain = 'cnn.com';
    if (clean.includes('reuters')) domain = 'reuters.com';
    if (clean.includes('guardian')) domain = 'theguardian.com';
    if (clean.includes('washingtonpost')) domain = 'washingtonpost.com';
    if (clean.includes('fox')) domain = 'foxnews.com';
    if (clean.includes('aljazeera')) domain = 'aljazeera.com';
    if (clean.includes('apnews') || clean === 'ap') domain = 'apnews.com';
    if (clean.includes('wnd')) domain = 'wnd.com';
    if (clean.includes('independent')) domain = 'independent.co.uk';
    return `https://logo.clearbit.com/${domain}`;
  };

  return (
    <div className="w-full space-y-4">
      {/* Count */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">Covered by</span>
        <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-full">{publishers.length} source{publishers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Platform logos row */}
      <div className="flex flex-wrap gap-3">
        {publishers.map((item, idx) => {
          const name = item.publisher || 'Unknown';
          return (
            <div
              key={idx}
              className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 cursor-default"
              title={name}
            >
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center border border-white/20 flex-shrink-0">
                <img
                  src={getLogoUrl(name)}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full text-[11px] font-bold text-white items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800">
                  {name.charAt(0).toUpperCase()}
                </div>
              </div>
              <span className="text-[12px] font-semibold text-gray-300 group-hover:text-white transition-colors truncate max-w-[120px]">
                {name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
