"use client";
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import RelatedFindingsSidebar from "../components/RelatedFindingsSidebar.jsx";
import AnalysisOverviewSidebar from "../components/AnalysisOverviewSidebar.jsx";
import SubsectionsModal from "../components/SubsectionsModal.jsx";
import ProtectedRoute from "../components/ProtectedRoute";
import { uploadDocumentCollection, getLatestOutput, getRelated, getCollectionDetails, addFilesToCollection } from '../lib/api';
import PdfJsExpressViewer from '../components/PDFViewer';
import PodcastSidebar from "../components/PodcastSidebar";
import InsightsSidebar from "../components/InsightsSidebar";
import { Loader2, X, ChevronLeft, ChevronRight, FileText, Search } from 'lucide-react';

function PdfViewerPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const collectionId = searchParams.get('collectionId');
	const file = searchParams.get('file');
	const pageParam = Number(searchParams.get('page')) || 1;
			const [analysisData, setAnalysisData] = useState(null);
			const [documents, setDocuments] = useState([]);
			const [documentUrlMap, setDocumentUrlMap] = useState({});
			const [isAdding, setIsAdding] = useState(false);
		const [isSidebarOpen, setIsSidebarOpen] = useState(true);
		const [isPodcastSidebarOpen, setIsPodcastSidebarOpen] = useState(false);
		const [isInsightsSidebarOpen, setIsInsightsSidebarOpen] = useState(false);
		const [selectedFile, setSelectedFile] = useState(file || null);
	const [selectedPage, setSelectedPage] = useState(pageParam);
	const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
	const [isRelatedOpen, setIsRelatedOpen] = useState(false);
	const [selectedSection, setSelectedSection] = useState(null);
	const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
	const [isSubsectionsModalOpen, setIsSubsectionsModalOpen] = useState(false);
	const [related, setRelated] = useState(null);
	const [lastSelectedText, setLastSelectedText] = useState('');
	const [showCopy, setShowCopy] = useState(false);
	const [queryText, setQueryText] = useState('');
	const [relatedLoading, setRelatedLoading] = useState(false);
	const [collectionError, setCollectionError] = useState(null);
	const [collectionLoading, setCollectionLoading] = useState(false);

	useEffect(() => {
		if (file) {
			setSelectedFile(file);
		}
	}, [file]);

	// Listen for related results from PDF selection
	useEffect(() => {
		function onRelated(e) {
			setRelated(e.detail);
		}
		window.addEventListener('axon:relatedResults', onRelated);
		function onSelected(e) {
			const text = (e && e.detail && e.detail.text) || '';
			setLastSelectedText(text);
			setShowCopy(!!text);
			if (text) setQueryText(text);
		}
		window.addEventListener('axon:selectedText', onSelected);
		return () => window.removeEventListener('axon:relatedResults', onRelated);
	}, []);

	const runRelatedSearch = async () => {
		const text = String(queryText || '').trim();
		if (!text || text.length < 3) return;
		setRelatedLoading(true);
		try {
			const resp = await getRelated(text, 20);
			setRelated(resp || { results: [] });
		} catch (e) {
			console.warn('Related search failed:', e);
			setRelated({ results: [] });
		} finally {
			setRelatedLoading(false);
		}
	};

	const handleCopySelected = async () => {
		const text = String(lastSelectedText || '').trim();
		if (!text) return;
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				// Fallback to hidden textarea
				const ta = document.createElement('textarea');
				ta.value = text;
				ta.style.position = 'fixed';
				ta.style.left = '-9999px';
				document.body.appendChild(ta);
				ta.focus();
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
			}
		} catch (e) {
			console.warn('Top-level copy failed:', e);
		} finally {
			setShowCopy(false);
		}
	};

	const groupedRelated = useMemo(() => {
		const out = { similar: [], contradictory: [], extends: [], problems: [] };
		if (!related || !Array.isArray(related.results)) return out;
		for (const r of related.results) {
			const key = r.relation || 'similar';
			(out[key] || out.similar).push(r);
		}
		return out;
	}, [related]);

	useEffect(() => {
		if (collectionId) return;
		const storedData = sessionStorage.getItem('analysisData');
		if (storedData) {
			const data = JSON.parse(storedData);
			const docs = (data && data.metadata && data.metadata.input_documents) || data.documents || [];
			setAnalysisData(data);
			setDocuments(docs);
			const map = {};
			docs.forEach((doc) => {
				if (doc) map[doc] = `/pdfs/${encodeURIComponent(doc)}`;
			});
			setDocumentUrlMap(map);
			if (docs.length) {
				setSelectedFile((prev) => prev || docs[0]);
			}
			sessionStorage.removeItem('analysisData');
			return;
		}

		getLatestOutput()
			.then((data) => {
				if (!data) return;
				const docs = (data && data.metadata && data.metadata.input_documents) || [];
				setAnalysisData(data);
				setDocuments(docs);
				const map = {};
				docs.forEach((doc) => {
					if (doc) map[doc] = `/pdfs/${encodeURIComponent(doc)}`;
				});
				setDocumentUrlMap(map);
				if (docs.length) {
					setSelectedFile((prev) => prev || docs[0]);
				}
			})
			.catch(() => {});
	}, [collectionId]);

	useEffect(() => {
		if (!collectionId) return;
		let cancelled = false;
		const loadCollection = async () => {
			setCollectionLoading(true);
			setCollectionError(null);
			try {
				const detail = await getCollectionDetails(collectionId);
				if (cancelled) return;
				console.log('[PDFViewer] Collection details:', detail);
				const analysis = detail?.analysis;
				if (analysis) {
					console.log('[PDFViewer] Setting analysis data:', analysis);
					setAnalysisData(analysis);
				} else {
					console.warn('[PDFViewer] No analysis data found in collection details');
				}
				const docsRaw = Array.isArray(detail?.documents) ? detail.documents : [];
				
				// Helper to normalize file names for comparison
				const normalizeFileName = (name) => {
					if (!name) return '';
					return decodeURIComponent(String(name)).replace(/\+/g, ' ').trim();
				};
				
				const normalized = docsRaw.map((doc, idx) => {
					// Extract filename from storedName if needed
					const extractFilename = (storedName) => {
						if (!storedName) return null;
						const parts = storedName.split('/');
						return parts[parts.length - 1] || storedName;
					};
					
					const name =
						doc?.originalName ||
						doc?.filename ||
						extractFilename(doc?.storedName) ||
						`Document ${idx + 1}`;
					
					let url = doc?.accessibleUrl || null;
					
					// Ensure URL is absolute if it's a relative path
					if (url && url.startsWith('/')) {
						url = `${window.location.origin}${url}`;
					}
					
					// Fallback to local PDF path if no accessibleUrl
					if (!url && doc?.originalName) {
						url = `${window.location.origin}/pdfs/${encodeURIComponent(doc.originalName)}`;
					}
					
					return { name, url, originalName: doc?.originalName };
				}).filter((d) => !!d.name);
				
				const docNames = normalized.map((d) => d.name);
				const map = {};
				normalized.forEach((d) => {
					if (d.url) {
						// Map by original name, normalized name, and stored name
						if (d.name) map[d.name] = d.url;
						if (d.originalName && d.originalName !== d.name) {
							map[d.originalName] = d.url;
						}
					}
				});
				
				setDocuments(docNames);
				setDocumentUrlMap(map);
				
				// Find matching file - decode URL-encoded file parameter first
				const decodedFileParam = file ? normalizeFileName(file) : null;
				let preferred = null;
				
				if (decodedFileParam) {
					// Try exact match first
					preferred = docNames.find(d => normalizeFileName(d) === decodedFileParam);
					
					// Try case-insensitive match
					if (!preferred) {
						preferred = docNames.find(d => 
							normalizeFileName(d).toLowerCase() === decodedFileParam.toLowerCase()
						);
					}
					
					// Try matching by originalName
					if (!preferred) {
						const matched = normalized.find(d => 
							d.originalName && normalizeFileName(d.originalName) === decodedFileParam
						);
						if (matched) preferred = matched.name;
					}
				}
				
				preferred = preferred || docNames[0] || null;
				
				if (preferred) {
					setSelectedFile(preferred);
					// Update URL if the file parameter doesn't match
					if (decodedFileParam && normalizeFileName(preferred) !== decodedFileParam) {
						const params = new URLSearchParams();
						params.set('collectionId', collectionId);
						params.set('file', preferred);
						router.replace(`/pdfviewer?${params.toString()}`, { scroll: false });
					}
				}
			} catch (err) {
				if (!cancelled) {
					setCollectionError(err?.message || 'Failed to load collection details');
				}
			} finally {
				if (!cancelled) setCollectionLoading(false);
			}
		};
		loadCollection();
		return () => {
			cancelled = true;
		};
	}, [collectionId, file, router]);

	// Compute docUrl - ensure it's absolute
	const docUrl = useMemo(() => {
		if (!selectedFile) return null;
		
		let url = documentUrlMap[selectedFile];
		
		// Fallback to local PDF path if not in map
		if (!url) {
			url = `/pdfs/${encodeURIComponent(selectedFile)}`;
		}
		
		// Ensure URL is absolute (for CORS and proper loading)
		if (url && url.startsWith('/')) {
			url = `${window.location.origin}${url}`;
		}
		
		return url;
	}, [selectedFile, documentUrlMap]);

		const buildViewerUrl = (pdfName, page) => {
			const params = new URLSearchParams();
			if (collectionId) params.set('collectionId', collectionId);
			if (pdfName) params.set('file', pdfName);
			if (page) params.set('page', page);
			return `/pdfviewer?${params.toString()}`;
		};

		const handlePdfSelect = (pdfName) => {
			if (pdfName && pdfName !== selectedFile) {
				setSelectedFile(pdfName);
				router.replace(buildViewerUrl(pdfName));
			}
		};

		const handleAddFiles = async (files) => {
			if (!files || files.length === 0) return;
			setIsAdding(true);
			try {
				// If we have a collectionId, add files to the existing collection
				if (collectionId) {
					const result = await addFilesToCollection(collectionId, files);
					
					// Reload collection details to get updated documents
					const detail = await getCollectionDetails(collectionId);
					
					if (detail?.analysis) {
						setAnalysisData(detail.analysis);
					}
					
					const docsRaw = Array.isArray(detail?.documents) ? detail.documents : [];
					const normalized = docsRaw.map((doc, idx) => {
						const name =
							doc?.originalName ||
							doc?.filename ||
							doc?.storedName ||
							`Document ${idx + 1}`;
						const url =
							doc?.accessibleUrl ||
							(doc?.originalName ? `/pdfs/${encodeURIComponent(doc.originalName)}` : null);
						return { name, url };
					}).filter((d) => !!d.name);
					
					const docNames = normalized.map((d) => d.name);
					const map = {};
					normalized.forEach((d) => {
						if (d.url) {
							map[d.name] = d.url;
						}
					});
					
					setDocuments(docNames);
					setDocumentUrlMap(map);
					
					// Select the last added file
					if (docNames.length > 0) {
						const latest = docNames[docNames.length - 1];
						setSelectedFile(latest);
						router.replace(buildViewerUrl(latest));
					}
				} else {
					// No collectionId - create new collection (original behavior)
					if (!analysisData) return;
					const newData = await uploadDocumentCollection(
						files,
						analysisData.collectionName,
						analysisData.personaRole,
						analysisData.jobTask
					);
					setAnalysisData(newData);
					const docs =
						(newData && newData.metadata && newData.metadata.input_documents) ||
						newData.documents ||
						[];
					setDocuments(docs);
					const map = {};
					docs.forEach((doc) => {
						if (doc) map[doc] = `/pdfs/${encodeURIComponent(doc)}`;
					});
					setDocumentUrlMap(map);
					if (docs.length) {
						const latest = docs[docs.length - 1];
						setSelectedFile(latest);
						router.replace(buildViewerUrl(latest));
					}
				}
			} catch (err) {
				console.error('Error adding files:', err);
				// Show user-friendly error message
				alert(err?.response?.data?.error || err?.message || 'Failed to add files. Please try again.');
			} finally {
				setIsAdding(false);
			}
		};

	return (
		<div className="flex flex-col h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-100">
			<Header 
				isSidebarOpen={isSidebarOpen} 
				toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
				onTogglePodcast={() => {
					setIsPodcastSidebarOpen((prev) => {
						const next = !prev;
						if (next) setIsInsightsSidebarOpen(false);
						return next;
					});
				}}
				onToggleInsights={() => {
					setIsInsightsSidebarOpen((prev) => {
						const next = !prev;
						if (next) setIsPodcastSidebarOpen(false);
						return next;
					});
				}}
				onToggleAnalysis={() => setIsAnalysisOpen((v) => !v)}
				isAnalysisOpen={isAnalysisOpen}
				onToggleRelated={() => setIsRelatedOpen((v) => !v)}
				isRelatedOpen={isRelatedOpen}
			/>
			<main className="flex flex-grow overflow-hidden relative">
				{collectionError && (
					<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-800 px-4 py-2 rounded shadow z-30">
						{collectionError}
					</div>
				)}
								<Sidebar
									isOpen={isSidebarOpen}
									documents={documents.length > 0 ? documents : (selectedFile ? [selectedFile] : [])}
									onPdfSelect={handlePdfSelect}
									selectedPdf={selectedFile}
									onAddFiles={handleAddFiles}
									isAdding={isAdding}
								/>
				<div className={`relative flex-grow h-full min-h-0 p-4 flex flex-col pdf-viewer-container transition-all duration-300 ${isAnalysisOpen ? 'mr-[420px]' : 'mr-0'}`}>
					<div className="relative border-2 border-purple-500/30 bg-gradient-to-br from-slate-50 to-indigo-50/30 h-full rounded-2xl shadow-2xl overflow-hidden">
						{docUrl && !collectionLoading ? (
							<PdfJsExpressViewer docUrl={docUrl} pageNumber={selectedPage} />
						) : (
							<div className="h-full flex flex-col items-center justify-center text-purple-700 font-semibold">
								{collectionLoading ? (
									<div className="flex flex-col items-center gap-3">
										<Loader2 className="h-8 w-8 animate-spin text-purple-700" />
										<span className="text-purple-800 font-semibold">Loading collection...</span>
									</div>
								) : (
									'Select a PDF to begin'
								)}
							</div>
						)}
						{showCopy && (
							<div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-red-700 text-white px-3 py-1.5 rounded shadow">
								<span className="text-xs max-w-[40vw] truncate" title={lastSelectedText}>Copy selected</span>
								<button onClick={handleCopySelected} className="text-xs font-semibold underline">Copy</button>
								<button onClick={() => setShowCopy(false)} className="text-xs">Ã—</button>
							</div>
						)}
					</div>
				</div>
				
				<RelatedFindingsSidebar
					isOpen={isRelatedOpen}
					onClose={() => setIsRelatedOpen(false)}
					queryText={queryText}
					setQueryText={setQueryText}
					related={related}
					groupedRelated={groupedRelated}
					relatedLoading={relatedLoading}
					onSearch={runRelatedSearch}
					onClickRelated={(r) => {
						const targetPage = Number(r.page_number) || 1;
						setSelectedPage(targetPage);
						if (r.document && r.document !== selectedFile) {
							setSelectedFile(r.document);
						}
						router.replace(buildViewerUrl(r.document || selectedFile, targetPage));
					}}
				/>
				
				<AnalysisOverviewSidebar
					isOpen={isAnalysisOpen}
					onClose={() => setIsAnalysisOpen(false)}
					analysisData={analysisData}
					selectedFile={selectedFile}
					onNavigate={(pageNum) => {
						const targetPage = Number(pageNum) || 1;
						setSelectedPage(targetPage);
						router.replace(buildViewerUrl(selectedFile, targetPage));
					}}
					onViewSubsections={(section, index) => {
						setSelectedSection(section);
						setSelectedSectionIndex(index);
						setIsSubsectionsModalOpen(true);
					}}
				/>

				<SubsectionsModal
					isOpen={isSubsectionsModalOpen}
					onClose={() => setIsSubsectionsModalOpen(false)}
					section={selectedSection}
					sectionIndex={selectedSectionIndex}
					onNavigate={(pageNum, doc) => {
						const targetPage = Number(pageNum) || 1;
						setSelectedPage(targetPage);
						if (doc && doc !== selectedFile) {
							setSelectedFile(doc);
							router.replace(buildViewerUrl(doc, targetPage));
						} else {
							router.replace(buildViewerUrl(selectedFile, targetPage));
						}
						setIsSubsectionsModalOpen(false);
					}}
				/>
				
				<PodcastSidebar 
					isOpen={isPodcastSidebarOpen} 
					onClose={() => setIsPodcastSidebarOpen(false)} 
				/>
				<InsightsSidebar 
					isOpen={isInsightsSidebarOpen} 
					onClose={() => setIsInsightsSidebarOpen(false)} 
				/>
			</main>
			
			<style jsx global>{`
				.custom-scrollbar {
					scrollbar-width: thin;
					scrollbar-color: rgba(100, 116, 139, 0.3) rgba(100, 116, 139, 0.1);
				}
				.custom-scrollbar::-webkit-scrollbar {
					width: 5px;
					height: 5px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: rgba(100, 116, 139, 0.1);
					border-radius: 3px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: rgba(100, 116, 139, 0.3);
					border-radius: 3px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: rgba(100, 116, 139, 0.5);
				}
			`}</style>
		</div>
	);
}

export default function PdfViewerPage() {
	return (
		<ProtectedRoute>
			<PdfViewerPageContent />
		</ProtectedRoute>
	);
}
