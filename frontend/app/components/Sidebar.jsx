"use client"
import { PlusCircle, Loader2, FileText } from 'lucide-react';
import React, { useRef } from 'react';

function Sidebar({
  isOpen,
  documents = [],
  onPdfSelect,
  selectedPdf,
  onAddFiles,
  isAdding,
}) {
  const fileInputRef = useRef(null);
  const handleAddClick = () => fileInputRef.current?.click();
  const handleFilesChange = (e) => {
    const files = e.target.files && Array.from(e.target.files);
    if (files && files.length && onAddFiles) onAddFiles(files);
    e.target.value = null;
  };

  return (
    <aside className={`transition-all duration-500 ease-in-out flex-shrink-0 h-full bg-gradient-to-br from-cyan-50/40 via-teal-50/30 to-emerald-50/40 backdrop-blur-xl border-r border-cyan-200/30 shadow-2xl overflow-hidden ${isOpen ? 'w-80' : 'w-0'}`}>
      <div className={`${!isOpen && 'hidden'} h-full flex flex-col overflow-hidden relative`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{animationDelay: '1.5s'}}></div>
        
        {/* Header with Gradient */}
        <div className="relative flex-shrink-0 p-6 pb-4 border-b border-cyan-200/30 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10 backdrop-blur-sm overflow-hidden z-10">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg">
                <FileText size={22} className="text-white" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-700 via-teal-700 to-emerald-700 bg-clip-text text-transparent">
                My Documents
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-xs font-semibold bg-gradient-to-r from-cyan-700 to-teal-700 bg-clip-text text-transparent">
                {documents.length} document{documents.length !== 1 ? 's' : ''} ready
              </p>
            </div>
          </div>
        </div>

  {/* Documents List - Enhanced */}
  <div className="relative flex-1 overflow-hidden px-4 py-4 min-h-0 flex flex-col z-10">
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-docs">
        <ul className="space-y-3">
          {documents.length > 0 ? (
            documents.map((doc) => {
              const docName = typeof doc === 'string' ? doc : doc.originalName;
              const isSelected = selectedPdf === docName;

              return (
              <li key={docName} className="transform transition-all duration-300 hover:scale-[1.02]">
                <button
                  onClick={() => onPdfSelect?.(docName)}
                  className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-100/90 to-teal-100/90 border-cyan-400/70 shadow-xl ring-2 ring-cyan-300/50'
                      : 'bg-white/60 backdrop-blur-sm border-cyan-200/50 hover:bg-gradient-to-br hover:from-cyan-50/80 hover:to-teal-50/80 hover:border-cyan-300/70 hover:shadow-lg'
                  }`}
                >
                  {/* Animated hover gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full pointer-events-none" style={{transition: 'transform 0.8s'}}></div>
                  
                  <div className="relative flex items-start gap-3">
                    <div className={`p-2 rounded-xl flex-shrink-0 shadow-sm ${
                      isSelected 
                        ? 'bg-gradient-to-br from-cyan-500 to-teal-600' 
                        : 'bg-gradient-to-br from-cyan-400/70 to-teal-500/70 group-hover:from-cyan-500 group-hover:to-teal-600'
                    } transition-all duration-300`}>
                      <FileText size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm leading-relaxed break-words ${
                        isSelected 
                          ? 'text-cyan-900' 
                          : 'text-cyan-800 group-hover:text-cyan-900'
                      } transition-colors duration-200`}>
                        {docName.replace('.pdf', '')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-700'
                            : 'bg-cyan-500/10 text-cyan-600 group-hover:bg-cyan-500/20'
                        } transition-colors duration-200`}>
                          PDF
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
              ); 
            })

          ) : (
            <li className="text-center py-12 animate-fadeIn">
              <div className="relative bg-white/60 backdrop-blur-md border-2 border-cyan-200/50 rounded-2xl p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-teal-50/50 opacity-50"></div>
                <div className="relative">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
                    <FileText size={48} className="text-cyan-400 relative z-10" />
                  </div>
                  <p className="text-cyan-800 text-sm font-bold mb-2">No documents yet</p>
                  <p className="text-cyan-600/70 text-xs leading-relaxed">Upload PDFs using the<br/>button below to get started</p>
                </div>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>

        {/* Add Files Button - Enhanced */}
        <div className="relative flex-shrink-0 p-5 pt-4 border-t border-cyan-200/30 bg-gradient-to-r from-cyan-500/5 via-teal-500/5 to-emerald-500/5 backdrop-blur-sm z-10">
          <button
            onClick={handleAddClick}
            disabled={isAdding}
            className={`relative w-full py-4 px-5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg text-sm overflow-hidden group ${
              isAdding 
                ? 'bg-gradient-to-r from-slate-400 to-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-700 hover:via-teal-700 hover:to-emerald-700 hover:shadow-2xl active:scale-[0.98] hover:scale-[1.02]'
            } text-white`}
          >
            {/* Animated background shine */}
            {!isAdding && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full" style={{transition: 'transform 1s'}}></div>
            )}
            
            <div className="relative z-10 flex items-center gap-3">
              {isAdding ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </>
              ) : (
                <>
                  <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span>Add More Files</span>
                </>
              )}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple className="hidden" onChange={handleFilesChange} />
        </div>
      </div>

      <style jsx global>{`
        /* Futuristic Document Scrollbar */
        .custom-scrollbar-docs {
          scrollbar-width: thin;
          scrollbar-color: rgba(6, 182, 212, 0.4) rgba(6, 182, 212, 0.1);
        }
        .custom-scrollbar-docs::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar-docs::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, rgba(6, 182, 212, 0.05), rgba(20, 184, 166, 0.05));
          border-radius: 10px;
        }
        .custom-scrollbar-docs::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(6, 182, 212, 0.6), rgba(20, 184, 166, 0.6));
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .custom-scrollbar-docs::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgba(6, 182, 212, 0.8), rgba(20, 184, 166, 0.8));
        }
        
        /* Grid Pattern */
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px);
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

export default Sidebar;
