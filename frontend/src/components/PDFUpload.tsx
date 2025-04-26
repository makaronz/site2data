import React, { useState, useRef } from 'react';
import axios from 'axios';

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

      console.log('Wysyłanie pliku do:', '/api/upload-pdf');
      const response = await axios.post('/api/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minut timeout
      });

      console.log('Odpowiedź serwera:', response.data);
      
      if (response.data.success && response.data.text) {
        onUploadSuccess(response.data.text);
      } else {
        throw new Error(response.data.message || 'Nie udało się przetworzyć pliku PDF');
      }
    } catch (error) {
      console.error('Błąd podczas przesyłania:', error);
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
    <div className="space-y-4">
      <div
        className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        aria-label="Obszar przesyłania pliku PDF"
        tabIndex={0}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf"
          className="hidden"
          aria-label="Wybierz plik PDF"
        />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-gray-600">
            {isUploading ? (
              'Przesyłanie pliku...'
            ) : (
              <>
                <p>Przeciągnij i upuść plik PDF tutaj</p>
                <p className="text-sm">lub kliknij, aby wybrać</p>
              </>
            )}
          </div>
        </div>
      </div>
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default PDFUpload; 