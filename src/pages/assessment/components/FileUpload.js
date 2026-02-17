import React, { useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

function FileUpload({ files, onAddFile, onRemoveFile }) {
  const handleFileChange = useCallback(
    (event) => {
      const fileList = event.target.files;
      if (!fileList) return;

      Array.from(fileList).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const uploadedFile = {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: e.target?.result,
          };
          onAddFile(uploadedFile);
        };
        reader.readAsDataURL(file);
      });
    },
    [onAddFile]
  );

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type) => {
    if (type.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5 text-purple-400" />;
    }
    return <FileText className="w-5 h-5 text-cyan-400" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fadeIn">
      <div className="glass rounded-lg p-6 border border-cyan-500/20">
        <h3 className="text-lg font-light mb-2 text-cyan-300 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          ENHANCE YOUR PROFILE
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Upload personality test results or abstract images to enrich your assessment.
        </p>

        <label className="block">
          <input
            type="file"
            accept=".pdf,.txt,.json,image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-cyan-500/60 hover:bg-cyan-500/5">
            <Upload className="w-8 h-8 mx-auto mb-3 text-cyan-400/60" />
            <p className="text-sm text-slate-300 mb-1">Click to upload files</p>
            <p className="text-xs text-slate-500">PDF, TXT, JSON, or images up to 5MB</p>
          </div>
        </label>

        {files.length > 0 && (
          <div className="mt-6 space-y-2 animate-fadeIn">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">
              Uploaded Files ({files.length})
            </p>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="text-sm text-slate-200 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;
