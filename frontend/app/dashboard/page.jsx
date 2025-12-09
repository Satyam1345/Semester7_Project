"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import { getHistory, getCollectionDetails } from '@/app/lib/api';
import { 
  Loader2, 
  FileText, 
  Upload, 
  LogOut, 
  Home, 
  Calendar, 
  User, 
  Briefcase,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

function DashboardPageContent() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { logout, user } = useAuth();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const history = await getHistory();
        setCollections(history);
        setError(null);
      } catch (err) {
        setError(err?.message || 'Failed to load collections');
        console.error('Error loading history:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [isNavigating, setIsNavigating] = useState(null); // new state for loading

  const handleCollectionClick = async (collection) => {
    if (!collection || isNavigating) return;
    const id = collection.collectionId || collection._id;
    if (!id) return;

    setIsNavigating(id); // Set loading state for this collection
    
    // Clear any previous session data to ensure fresh fetch
    sessionStorage.removeItem('analysisData');
    
    // Navigate directly with collectionId - let the PDFViewer fetch fresh data
    router.push(`/pdfviewer?collectionId=${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ready: { 
        icon: CheckCircle, 
        color: 'bg-green-100 text-green-800 border-green-300',
        label: 'Ready'
      },
      processing: { 
        icon: Clock, 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        label: 'Processing'
      },
      error: { 
        icon: AlertCircle, 
        color: 'bg-red-100 text-red-800 border-red-300',
        label: 'Error'
      },
      idle: { 
        icon: Clock, 
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        label: 'Idle'
      }
    };

    const config = statusConfig[status] || statusConfig.idle;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.color}`}>
        <Icon className="w-3 h-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-200">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-red-700 to-red-600 shadow-lg border-b border-red-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-4">
              <div 
                onClick={() => router.push('/')}
                className="cursor-pointer flex items-center space-x-2 group"
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-white/30 transition-all duration-200">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white tracking-wide">Axon</span>
                  <span className="text-sm font-semibold text-red-100 tracking-wide">Docs</span>
                </div>
              </div>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              {user && (
                <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-8 h-8 rounded-full border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">
                      {user.displayName || 'User'}
                    </span>
                    <span className="text-xs text-red-100">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={() => router.push('/upload')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm border border-white/20 text-white transition-all duration-200 group"
              >
                <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Upload</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm border border-white/20 text-white transition-all duration-200 group"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-red-900 mb-2">My Collections</h1>
              <p className="text-red-700">View and manage your document analysis collections</p>
            </div>
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>New Collection</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Error loading collections</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && collections.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-12 text-center">
            <FileText className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-900 mb-2">No Collections Yet</h3>
            <p className="text-red-700 mb-6">Get started by uploading your first document collection</p>
            <button
              onClick={() => router.push('/upload')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Upload className="w-5 h-5" />
              <span>Create Your First Collection</span>
            </button>
          </div>
        )}

        {/* Collections Grid */}
        {!loading && !error && collections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.collectionId || collection._id}
                onClick={() => handleCollectionClick(collection)}
                disabled={isNavigating === (collection.collectionId || collection._id)}
                className="bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 hover:shadow-red-500/20 hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden transform hover:-translate-y-2"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-white/20">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-extrabold text-red-800 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {collection.name || 'Unnamed Collection'}
                    </h3>
                    {getStatusBadge(collection.status || 'idle')}
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-5 pb-5 space-y-4">
                  {/* Persona */}
                  {collection.persona && (
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 flex-shrink-0 bg-red-100/70 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Persona</p>
                        <p className="text-sm font-medium text-red-800 line-clamp-2">{collection.persona}</p>
                      </div>
                    </div>
                  )}

                  {/* Job to be Done */}
                  {collection.jobToBeDone && (
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 flex-shrink-0 bg-red-100/70 rounded-full flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Objective</p>
                        <p className="text-sm font-medium text-red-800 line-clamp-2">{collection.jobToBeDone}</p>
                      </div>
                    </div>
                  )}

                  {/* Documents Count */}
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 flex-shrink-0 bg-red-100/70 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Documents</p>
                      <p className="text-sm font-medium text-red-800">{collection.documentsCount || 0} file(s)</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-start space-x-4 pt-4 border-t border-white/20">
                    <div className="w-10 h-10 flex-shrink-0 bg-red-100/70 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Created</p>
                      <p className="text-sm font-medium text-red-800">{formatDate(collection.createdAt)}</p>
                      {collection.lastRunAt && (
                        <>
                          <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mt-2">Last Run</p>
                          <p className="text-sm font-medium text-red-800">{formatDate(collection.lastRunAt)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 py-4 bg-white/10 border-t border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                  <span className="text-sm font-bold text-red-700 group-hover:text-red-800 transition-colors">View Collection</span>
                  <ArrowRight className="w-5 h-5 text-red-600 ml-2 transform transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-110" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardPageContent />
    </ProtectedRoute>
  );
}
