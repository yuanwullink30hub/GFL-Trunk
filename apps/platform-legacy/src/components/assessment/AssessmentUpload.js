import React, { useCallback, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * AssessmentUpload - File upload screen shown after all questions
 */
const AssessmentUpload = ({ 
  files = [], 
  onAddFile, 
  onRemoveFile, 
  onContinue,
  onSkip 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguage();

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(file => onAddFile(file));
  }, [onAddFile]);

  const handleFileInput = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach(file => onAddFile(file));
    e.target.value = ''; // Reset input
  }, [onAddFile]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className="relative w-full mx-auto rounded-lg backdrop-blur-xl animate-fadeIn overflow-hidden"
      style={{ backgroundColor: 'rgba(2, 0, 3, 0.3)', maxWidth: '53rem', boxShadow: '0 6px 30px rgba(0,0,0,0.7), 0 12px 60px rgba(0,0,0,0.5), 0 0 80px rgba(0,0,0,0.35), 0 0 120px rgba(0,0,0,0.15), inset 0 0 12px rgba(255, 174, 0, 0.06), inset 0 0 30px rgba(255, 174, 0, 0.03)' }}
    >
      {/* Top-Left Corner Border */}
      <div className="absolute -top-0.5 -left-0.5 w-4 h-4" style={{
        border: '1.5px solid #ffae00',
        borderRadius: '10px 0 0 0',
        borderBottom: 'none',
        borderRight: 'none'
      }}></div>
      
      {/* Top-Right Corner Border */}
      <div className="absolute -top-0.5 -right-0.5 w-4 h-4" style={{
        border: '1.5px solid #ffae00',
        borderRadius: '0 10px 0 0',
        borderBottom: 'none',
        borderLeft: 'none'
      }}></div>
      
      {/* Bottom-Left Corner Border */}
      <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4" style={{
        border: '1.5px solid #ffae00',
        borderRadius: '0 0 0 10px',
        borderTop: 'none',
        borderRight: 'none'
      }}></div>
      
      {/* Bottom-Right Corner Border */}
      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4" style={{
        border: '1.5px solid #ffae00',
        borderRadius: '0 0 10px 0',
        borderTop: 'none',
        borderLeft: 'none'
      }}></div>
      
      {/* Holographic sheen */}
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
        background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.015) 30%, transparent 50%, rgba(255,255,255,0.01) 70%, transparent 100%)',
        backgroundSize: '400% 400%',
        backgroundRepeat: 'no-repeat',
        animation: 'holoSheen 45s ease-in-out infinite',
        mixBlendMode: 'screen',
      }} />

      {/* Scanline sweep */}
      <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.008) 48%, rgba(255,255,255,0.015) 50%, rgba(255,255,255,0.008) 52%, transparent 100%)',
        backgroundSize: '100% 300%',
        animation: 'holoScanline 14s linear infinite',
      }} />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 rounded-lg pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

      {/* Content - matches SectorFrame inner structure */}
      <div className="relative z-10 h-full w-full p-5 flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <h2 className="text-2xl font-light text-white mb-2">{t('assessmentUpload.assessmentComplete')}</h2>
        <p className="text-slate-400 text-sm">{t('assessmentUpload.answeredAll')}</p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4 text-center">
          {t('assessmentUpload.optionalUpload')}
        </h3>
        
        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
            ${isDragging 
              ? 'border-cyan-400 bg-cyan-500/10' 
              : 'border-slate-700 hover:border-slate-600'
            }
          `}
        >
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          
          <div className="pointer-events-none">
            <div className={`
              w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center
              ${isDragging ? 'bg-cyan-500/20' : 'bg-slate-800'}
            `}>
              <svg className={`w-6 h-6 ${isDragging ? 'text-cyan-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <p className="text-slate-300 mb-1">
              {isDragging ? t('assessmentUpload.dropFiles') : t('assessmentUpload.dragDrop')}
            </p>
            <p className="text-xs text-slate-500">
              {t('assessmentUpload.orClickBrowse')}
            </p>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm text-slate-300 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => onRemoveFile(index)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-600 text-center mt-4">
          {t('assessmentUpload.filesProcessed')}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-lg text-white font-medium hover:from-cyan-500 hover:to-purple-500 transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('assessmentUpload.generateProfile')}
        </button>
        
        <button
          onClick={onSkip}
          className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
        >
          {t('assessmentUpload.skipUpload')}
        </button>
      </div>
      </div>
    </div>
  );
};

export default AssessmentUpload;
