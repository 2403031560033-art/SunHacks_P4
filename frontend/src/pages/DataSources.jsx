import { useState, useEffect } from 'react';
import { Database, FileText, Clock, Hash, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import FileUpload from '../components/FileUpload';
import { getDocuments, deleteDocument } from '../services/api';

const FILE_TYPE_ICONS = {
  slack: '💬',
  email: '📧',
  pdf: '📄',
  text: '📝',
};

const FILE_TYPE_COLORS = {
  slack: 'text-accent-purple-light bg-accent-purple/15',
  email: 'text-accent-teal bg-accent-teal/15',
  pdf: 'text-accent-rose bg-accent-rose/15',
  text: 'text-accent-amber bg-accent-amber/15',
};

export default function DataSources() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleDelete = async (docId) => {
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return isoString; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-emerald/15 flex items-center justify-center">
            <Database className="w-5 h-5 text-accent-emerald" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Data Sources</h1>
            <p className="text-xs text-gray-500">{documents.length} document{documents.length !== 1 ? 's' : ''} ingested</p>
          </div>
        </div>
        <button
          onClick={fetchDocuments}
          className="p-2.5 rounded-xl bg-dark-700/50 border border-white/5 text-gray-400 hover:text-white transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Upload Section */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Upload New Document</h2>
        <FileUpload onUploadComplete={fetchDocuments} />
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-accent-purple animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <Database className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No documents uploaded yet</p>
            <p className="text-xs text-gray-600 mt-1">Upload files above to get started</p>
          </div>
        ) : (
          documents.map((doc, i) => (
            <div
              key={doc.id}
              className="glass-card p-4 flex items-center gap-4 fade-in-up group"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${FILE_TYPE_COLORS[doc.file_type] || 'bg-dark-600 text-gray-400'}`}>
                {FILE_TYPE_ICONS[doc.file_type] || '📁'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(doc.upload_time)}
                  </span>
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {doc.chunk_count} chunks
                  </span>
                  <span className="text-[11px] text-gray-500 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {doc.decision_count} decisions
                  </span>
                </div>
              </div>

              {/* Type badge */}
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium uppercase tracking-wider ${FILE_TYPE_COLORS[doc.file_type] || 'bg-dark-600 text-gray-400'}`}>
                {doc.file_type}
              </span>

              {/* Status */}
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-accent-emerald/10 text-accent-emerald">
                {doc.status}
              </span>

              {/* Delete */}
              <button
                onClick={() => handleDelete(doc.id)}
                className="p-2 rounded-lg text-gray-600 hover:text-accent-rose hover:bg-accent-rose/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
