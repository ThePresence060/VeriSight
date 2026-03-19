import React from 'react';
import { getCredibilityColor, getCredibilityLabel } from '../../utils/credibility';

export function CredibilityBadge({ score, verdict }) {
  const defaultVerdict = verdict || getCredibilityLabel(score);
  const colorClasses = getCredibilityColor(score);
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm ${colorClasses}`}
      aria-label={`Credibility: ${defaultVerdict} (${score})`}
    >
      {defaultVerdict}
    </span>
  );
}

export function RiskTag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 mr-2 mb-2 shadow-sm">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
      {label}
    </span>
  );
}
