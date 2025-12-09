'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Youtube, ExternalLink, Loader2, PlayCircle } from 'lucide-react';

export default function YouTubeRecommendationsModal({ isOpen, onClose }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && !hasGenerated && !loading && recommendations.length === 0) {
      generateRecommendations();
    }
  }, [isOpen]);

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const context = sessionStorage.getItem('podcastContext');
      let persona = 'a curious learner';
      let jobTask = 'learn more';
      
      if (context) {
        const parsed = JSON.parse(context);
        persona = parsed.persona || persona;
        jobTask = parsed.jobTask || jobTask;
      }

      const res = await fetch('/api/generate-youtube-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, jobTask })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || 'Failed to fetch recommendations');
      }
      
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setHasGenerated(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="flex items-center gap-3">
            <Youtube className="w-6 h-6" />
            <h2 className="text-xl font-bold">Curated Video Recommendations</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-medium">Curating the best videos for you...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={generateRecommendations}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No recommendations found.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {recommendations.map((rec, idx) => (
                <a 
                  key={idx}
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(rec.searchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block bg-white p-4 rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                      <PlayCircle className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-red-700 transition-colors mb-1">
                        {rec.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {rec.reason}
                      </p>
                      <div className="flex items-center text-xs text-red-600 font-medium">
                        <span>Watch on YouTube</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
