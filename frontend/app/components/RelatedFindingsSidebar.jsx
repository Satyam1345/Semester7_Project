"use client"
import { Search as SearchIcon, X, TrendingUp, AlertTriangle, Lightbulb, HelpCircle } from 'lucide-react';
import React from 'react';

function RelatedFindingsSidebar({
  isOpen,
  onClose,
  queryText,
  setQueryText,
  related,
  groupedRelated,
  relatedLoading,
  onSearch,
  onClickRelated,
}) {
  
  // Icon and color mapping for relation types - Enhanced futuristic theme
  const relationConfig = {
    similar: {
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-gradient-to-br from-blue-50/90 via-cyan-50/70 to-blue-50/90',
      border: 'border-blue-300/50',
      glow: 'hover:shadow-blue-500/30',
      label: 'Similar Content',
      badge: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    contradictory: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-gradient-to-br from-amber-50/90 via-orange-50/70 to-amber-50/90',
      border: 'border-amber-300/50',
      glow: 'hover:shadow-amber-500/30',
      label: 'Contradictory',
      badge: 'bg-gradient-to-r from-amber-500 to-orange-500'
    },
    extends: {
      icon: Lightbulb,
      color: 'text-emerald-600',
      bg: 'bg-gradient-to-br from-emerald-50/90 via-green-50/70 to-emerald-50/90',
      border: 'border-emerald-300/50',
      glow: 'hover:shadow-emerald-500/30',
      label: 'Extends/Improves',
      badge: 'bg-gradient-to-r from-emerald-500 to-green-500'
    },
    problems: {
      icon: HelpCircle,
      color: 'text-rose-600',
      bg: 'bg-gradient-to-br from-rose-50/90 via-pink-50/70 to-rose-50/90',
      border: 'border-rose-300/50',
      glow: 'hover:shadow-rose-500/30',
      label: 'Problems/Limitations',
      badge: 'bg-gradient-to-r from-rose-500 to-pink-500'
    }
  };

  return (
    <aside className={`transition-all duration-500 ease-in-out flex-shrink-0 h-full bg-gradient-to-br from-purple-50/40 via-indigo-50/30 to-blue-50/40 backdrop-blur-xl border-l border-purple-200/30 shadow-2xl overflow-hidden ${isOpen ? 'w-[420px]' : 'w-0'}`}>
      <div className={`${!isOpen && 'hidden'} h-full flex flex-col overflow-hidden`}>
        {/* Header with Gradient */}
        <div className="flex-shrink-0 p-6 border-b border-purple-200/30 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 backdrop-blur-sm relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
                  <SearchIcon size={20} className="text-white" />
                </div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent">
                  Related Findings
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/60 backdrop-blur-sm transition-all duration-200 hover:rotate-90 hover:scale-110 group"
                aria-label="Close related findings"
              >
                <X size={20} className="text-purple-600 group-hover:text-purple-800 transition-colors" />
              </button>
            </div>
            <p className="text-xs text-purple-700/80 font-medium flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-purple-500 animate-pulse inline-block"></span>
              Discover connected insights across your documents
            </p>
          </div>
        </div>

        {/* Search Input - Futuristic Design */}
        <div className="flex-shrink-0 p-6 border-b border-purple-200/30 bg-white/30 backdrop-blur-sm">
          <div className="relative">
            {/* Glowing effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <textarea
              value={queryText || ''}
              onChange={(e) => setQueryText?.(e.target.value)}
              rows={4}
              placeholder="✨ Paste text or enter a search query to discover related insights..."
              className="relative w-full text-sm p-4 border-2 border-purple-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 bg-white/80 backdrop-blur-sm shadow-lg resize-none transition-all duration-300 placeholder:text-purple-400/60 hover:border-purple-300"
            />
          </div>
          
          <button
            onClick={onSearch}
            disabled={relatedLoading || !String(queryText || '').trim()}
            className={`mt-4 w-full inline-flex items-center justify-center gap-3 px-5 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 transform ${
              relatedLoading || !String(queryText || '').trim()
                ? 'bg-slate-300/50 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <SearchIcon size={18} className={relatedLoading ? '' : 'animate-pulse'} />
            {relatedLoading ? (
              <>
                <span>Searching</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </>
            ) : 'Search Related Content'}
          </button>
          
          {!!related && Array.isArray(related.results) && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-100/80 to-blue-100/80 backdrop-blur-sm border border-purple-200/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">
                  {related.results.length} {related.results.length === 1 ? 'Result' : 'Results'} Found
                </span>
                <div className="flex gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1 h-4 bg-gradient-to-t from-purple-500 to-blue-500 rounded-full animate-pulse" style={{animationDelay: `${i * 0.15}s`}}></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results - Enhanced Design */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 custom-scrollbar-futuristic">
          {groupedRelated && (
            <>
              {['similar', 'contradictory', 'extends', 'problems']
                .filter((k) => (groupedRelated[k] || []).length > 0)
                .map((relationType) => {
                  const config = relationConfig[relationType];
                  const Icon = config.icon;
                  const results = groupedRelated[relationType] || [];
                  
                  return (
                    <div key={relationType} className="space-y-3 animate-fadeIn">
                      {/* Category Header - Futuristic */}
                      <div className="flex items-center gap-3 mb-3 pb-2 border-b-2 border-gradient">
                        <div className={`p-2 rounded-xl ${config.badge} shadow-lg`}>
                          <Icon size={16} className="text-white" />
                        </div>
                        <h3 className={`text-sm font-bold ${config.color} flex-1`}>
                          {config.label}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full ${config.badge} text-white text-xs font-bold shadow-md`}>
                            {results.length}
                          </span>
                        </div>
                      </div>
                      
                      {/* Results - Enhanced Cards */}
                      <ul className="space-y-3">
                        {results.map((r, idx) => (
                          <li key={relationType + idx} className="transform transition-all duration-300 hover:scale-[1.02]">
                            <button
                              className={`w-full text-left p-4 rounded-2xl border-2 ${config.border} ${config.bg} backdrop-blur-md ${config.glow} hover:shadow-2xl transition-all duration-300 cursor-pointer group relative overflow-hidden`}
                              onClick={() => onClickRelated?.(r)}
                            >
                              {/* Animated hover gradient */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full" style={{transition: 'transform 0.8s'}}></div>
                              
                              <div className="relative z-10">
                                {/* Document info */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <div className="text-xs text-slate-700 font-semibold truncate">
                                      {r.document}
                                      {String(r.document).toLowerCase().endsWith('.pdf') ? '' : '.pdf'}
                                    </div>
                                  </div>
                                  <div className={`px-2.5 py-1 rounded-lg ${config.badge} text-white text-xs font-bold shadow-sm`}>
                                    Page {r.page_number}
                                  </div>
                                </div>
                                
                                {/* Snippet */}
                                <div className="text-xs text-slate-800 line-clamp-4 whitespace-pre-wrap break-words leading-relaxed bg-white/50 p-3 rounded-xl">
                                  {r.snippet}
                                </div>
                                
                                {/* Score indicator with enhanced design */}
                                {r.score !== undefined && (
                                  <div className="mt-3 flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full overflow-hidden shadow-inner">
                                      <div 
                                        className={`h-full ${config.badge} transition-all duration-500 ease-out rounded-full shadow-lg`}
                                        style={{ width: `${Math.min(100, Math.max(0, r.score * 100))}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-bold ${config.color} min-w-[45px] text-right`}>
                                      {(r.score * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              
              {/* Empty state - Enhanced */}
              {['similar', 'contradictory', 'extends', 'problems'].every((k) => (groupedRelated[k] || []).length === 0) && (
                <div className="text-center py-16 px-6">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-2xl animate-pulse"></div>
                    <SearchIcon size={64} className="text-purple-300 relative z-10" />
                  </div>
                  <p className="text-base font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent mb-3">
                    No related content found
                  </p>
                  <p className="text-sm text-slate-600">
                    Try searching with different keywords or paste text from the document
                  </p>
                </div>
              )}
            </>
          )}
          
          {/* Initial empty state - Enhanced */}
          {!related && (
            <div className="text-center py-16 px-6">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative z-10 p-6 rounded-3xl bg-gradient-to-br from-purple-100/50 to-blue-100/50 backdrop-blur-sm">
                  <SearchIcon size={64} className="text-purple-500 mx-auto" />
                </div>
              </div>
              <p className="text-lg font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent mb-3">
                Start Your Discovery
              </p>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                Enter text above and click search to find related content across all your documents
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Futuristic Custom Scrollbar */
        .custom-scrollbar-futuristic {
          scrollbar-width: thin;
          scrollbar-color: rgba(147, 51, 234, 0.4) rgba(147, 51, 234, 0.1);
        }
        .custom-scrollbar-futuristic::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-futuristic::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, rgba(147, 51, 234, 0.05), rgba(79, 70, 229, 0.05));
          border-radius: 10px;
        }
        .custom-scrollbar-futuristic::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(147, 51, 234, 0.6), rgba(79, 70, 229, 0.6));
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .custom-scrollbar-futuristic::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(147, 51, 234, 0.8), rgba(79, 70, 229, 0.8));
        }
        
        /* Grid Pattern Background */
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(147, 51, 234, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 51, 234, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        /* Fade In Animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </aside>
  );
}

export default RelatedFindingsSidebar;
