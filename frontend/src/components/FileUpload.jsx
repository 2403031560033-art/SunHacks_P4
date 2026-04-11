import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { uploadFile } from '../services/api';

export default function FileUpload({ onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const acceptedTypes = '.json,.txt,.pdf,.md,.csv';

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleUpload(files[0]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) handleUpload(e.target.files[0]);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    setResult(null);
    setError(null);

    try {
      const data = await uploadFile(file, setProgress);
      setResult(data);
      if (onUploadComplete) onUploadComplete(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-blue-400 bg-blue-50 scale-[1.02]'
            : uploading
              ? 'border-blue-300 bg-slate-50'
              : 'border-slate-200 bg-white/50 hover:border-blue-300 hover:bg-blue-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 mx-auto animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Processing document...</p>
            <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-purple to-accent-teal rounded-full transition-all duration-500"
                style={{ width: `${Math.max(progress, 10)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{progress}% uploaded</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
              <Upload className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Drop files here or <span className="text-blue-600 cursor-pointer hover:underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Supports: Slack JSON, Emails (.txt), PDFs, Meeting Notes
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Success Result */}
      {result && (
        <div className="glass-card p-4 fade-in-up">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-accent-emerald mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-accent-emerald">{result.message}</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs text-slate-500 font-medium">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {result.chunks_created} chunks
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    📋 {result.decisions_found} decisions found
                  </span>
                </div>
              </div>
            </div>
            <button onClick={reset} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card p-4 border-accent-rose/30 fade-in-up">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-rose mt-0.5 shrink-0" />
              <p className="text-sm text-accent-rose">{error}</p>
            </div>
            <button onClick={reset} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
