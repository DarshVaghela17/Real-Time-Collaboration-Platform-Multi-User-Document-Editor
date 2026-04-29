import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface FileUploadZoneProps {
  onUploadSuccess: (documentId: string, title: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onUploadSuccess,
  onError,
  disabled = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/x-yaml',
  ];

  const ALLOWED_EXTENSIONS = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'md',
    'csv',
    'yaml',
    'yml',
  ];

  const validateFile = (file: File): boolean => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isTypeAllowed = ALLOWED_TYPES.includes(file.type) || file.type.startsWith('text/');
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(extension);

    if (!isTypeAllowed && !isExtAllowed) {
      setError('File type not supported. Please upload: PDF, Word, Excel, PowerPoint, Text, Markdown, or CSV');
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccess(null);

    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (customTitle.trim()) {
        formData.append('title', customTitle);
      }

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      console.log('Upload response data:', data); // Debug log
      setSuccess('File uploaded successfully!');
      const docId = data.data.document._id || data.data.document.id;
      const docTitle = data.data.document.title;
      console.log('Document ID:', docId, 'Title:', docTitle); // Debug log

      // Clear state
      setSelectedFile(null);
      setCustomTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call success callback
      setTimeout(() => {
        onUploadSuccess(docId, docTitle);
      }, 1000);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to upload file';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setCustomTitle('');
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'action.hover' : 'transparent',
          transition: 'all 0.3s ease',
          cursor: disabled || isUploading ? 'not-allowed' : 'pointer',
          opacity: disabled || isUploading ? 0.6 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={disabled || isUploading}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.yaml,.yml"
        />

        <CloudUploadIcon
          sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
        />

        <Typography variant="h6" gutterBottom>
          {selectedFile ? selectedFile.name : 'Drag and drop your file here'}
        </Typography>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          or click the button below to browse
        </Typography>

        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 2 }}>
          Supported formats: PDF, Word, Excel, PowerPoint, Text, Markdown, CSV (Max 50MB)
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            Browse Files
          </Button>

          {selectedFile && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleClear}
              disabled={isUploading}
              startIcon={<CloseIcon />}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      {selectedFile && (
        <Paper sx={{ mt: 3, p: 3, backgroundColor: 'action.hover' }}>
          <Typography variant="subtitle2" gutterBottom>
            File Selected: <strong>{selectedFile.name}</strong>
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Custom Title (optional):
            </Typography>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Leave blank to use filename"
              disabled={isUploading}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            />
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={disabled || isUploading}
              sx={{ flex: 1 }}
            >
              {isUploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </Button>
          </Box>
        </Paper>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess(null)}
          sx={{ mt: 2 }}
          icon={<CheckCircleIcon />}
        >
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default FileUploadZone;
