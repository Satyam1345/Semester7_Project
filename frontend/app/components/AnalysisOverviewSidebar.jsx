"use client";
import { X, ChevronRight, BookOpen, Eye } from 'lucide-react';

export default function AnalysisOverviewSidebar({ isOpen, onClose, analysisData, selectedFile, onNavigate, onViewSubsections }) {
  if (!isOpen) return null;

  console.log('[Sidebar] Render. analysisData:', analysisData);
  if (analysisData) {
      console.log('[Sidebar] extracted_sections type:', typeof analysisData.extracted_sections);
      console.log('[Sidebar] Is array?', Array.isArray(analysisData.extracted_sections));
      console.log('[Sidebar] Length:', analysisData.extracted_sections?.length);
  }

  // Backend returns "extracted_sections" not "highlighted_sections"
  // Handle potential nesting or direct access
  let highlightedSections = [];
  if (analysisData) {
    if (Array.isArray(analysisData.extracted_sections)) {
      highlightedSections = analysisData.extracted_sections;
    } else if (analysisData.analysis && Array.isArray(analysisData.analysis.extracted_sections)) {
      highlightedSections = analysisData.analysis.extracted_sections;
    }
  }
  
  console.log('[Sidebar] Final highlightedSections length:', highlightedSections.length);

  // Backend returns subsections separately in "subsection_analysis" array
  const subsections = Array.isArray(analysisData?.subsection_analysis)
    ? analysisData.subsection_analysis
    : (analysisData?.analysis?.subsection_analysis || []);	return (
		<div className={`fixed right-0 top-0 h-full w-[420px] bg-gradient-to-br from-slate-50 via-white to-blue-50/30 shadow-2xl z-40 flex flex-col border-l border-slate-200 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
			{/* Header */}
			<div className="flex-none p-6 border-b border-slate-200/70 bg-gradient-to-r from-slate-100/50 to-blue-100/30">
				<div className="flex items-center justify-between mb-2">
					<h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
						<div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
						Highlighted Sections
					</h2>
					<button 
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-slate-200/60 transition-colors"
						aria-label="Close analysis overview"
					>
						<X size={20} className="text-slate-600" />
					</button>
				</div>
				<p className="text-sm text-slate-600 ml-6">
					{highlightedSections.length} section{highlightedSections.length !== 1 ? 's' : ''} found • Click to view subsections
				</p>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto custom-scrollbar p-6">
				{highlightedSections.length > 0 ? (
					<div className="space-y-3">
						{highlightedSections.map((section, idx) => (
							<div 
								key={`hl-${idx}`} 
								className="group p-4 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
							>
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-2 flex-1">
										<span className="px-2.5 py-1 rounded-md bg-blue-600 text-white text-xs font-bold shadow-sm">
											Rank {idx + 1}
										</span>
										<span className="text-xs font-semibold text-blue-600">
											Page {section.page_number}
										</span>
									</div>
								</div>
								
								{/* PDF Document Name */}
								{section.document && (
									<div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md bg-slate-100/80 w-fit">
										<svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
										</svg>
										<span className="text-xs font-medium text-slate-600 truncate max-w-[280px]" title={section.document}>
											{section.document}
										</span>
									</div>
								)}
								
								<div className="text-sm font-semibold text-slate-800 mb-2 line-clamp-2">
									{section.section_name || section.section_title || 'Untitled Section'}
								</div>
								
								<div className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
									{section.refined_text || (subsections[idx] && subsections[idx].refined_text) || 'No content available'}
								</div>

								{/* Action Buttons */}
								<div className="flex items-center gap-2 pt-2 border-t border-blue-100">
									<button
										onClick={() => onNavigate && onNavigate(section.page_number)}
										className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
									>
										<ChevronRight size={14} />
										Go to Page
									</button>
									<button
										onClick={() => onViewSubsections && onViewSubsections(
											{ ...section, subsections }, // Pass section with all subsections
											idx
										)}
										className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold transition-colors"
									>
										<Eye size={14} />
										View Subsections
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="flex items-center justify-center h-full">
						<div className="text-center p-8">
							<div className="text-slate-400 mb-3">
								<BookOpen size={48} className="mx-auto" />
							</div>
							<p className="text-slate-600 font-medium">No highlighted sections available</p>
							<p className="text-sm text-slate-500 mt-1">Upload and process a document to see analysis</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
