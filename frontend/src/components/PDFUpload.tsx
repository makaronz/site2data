import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, Button, CircularProgress, Alert } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

interface PDFUploadProps {
  onUploadSuccess: (text: string) => void;
  onUploadError: (error: string) => void;
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onUploadSuccess, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    if (file.type !== 'application/pdf') {
      const error = 'Proszę wybrać plik PDF';
      setErrorMessage(error);
      onUploadError(error);
      return;
    }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('pdf', file);
      const response = await axios.post('/api/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      if (response.data.success && response.data.text) {
        onUploadSuccess(response.data.text);
      } else {
        throw new Error(response.data.message || 'Nie udało się przetworzyć pliku PDF');
      }
    } catch (error) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : 'Wystąpił błąd podczas przesyłania pliku';
      setErrorMessage(errorMsg);
      onUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={isDragging ? 6 : 2}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'grey.400',
          bgcolor: isDragging ? 'grey.100' : 'background.paper',
          textAlign: 'center',
          cursor: isUploading ? 'wait' : 'pointer',
          opacity: isUploading ? 0.5 : 1,
          outline: isDragging ? '2px solid' : 'none',
          outlineColor: isDragging ? 'primary.main' : 'none',
          transition: 'border-color 0.2s, outline 0.2s',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        role="button"
        aria-label="Obszar przesyłania pliku PDF"
        tabIndex={0}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf"
          style={{ display: 'none' }}
          aria-label="Wybierz plik PDF"
        />
        <Box sx={{ mb: 2 }}>
          <PictureAsPdfIcon sx={{ fontSize: 48, color: 'grey.400' }} />
        </Box>
        <Typography color="text.secondary">
          {isUploading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} /> Przesyłanie pliku...
            </>
          ) : (
            <>
              Przeciągnij i upuść plik PDF tutaj
              <Typography variant="body2" color="text.disabled">lub kliknij, aby wybrać</Typography>
            </>
          )}
        </Typography>
      </Paper>
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}
    </Box>
  );
};

export default PDFUpload; 