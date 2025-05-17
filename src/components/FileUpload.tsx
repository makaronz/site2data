import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { trpc } from '../utils/trpc';

interface FileUploadProps {
  onUploadComplete: (jobId: string) => void;
}

const MAX_FILE_SIZE_MB = 50; // Adjust as needed

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Clear previous errors
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Dozwolony jest tylko format PDF.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Plik jest za duży (maksymalnie ${MAX_FILE_SIZE_MB} MB).`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Krok 1: Uzyskaj Presigned URL z API Gateway (tRPC)
      console.log('Requesting presigned URL for:', selectedFile.name);
      const presignedUrlResponse = await trpc.requestPresignedUrl.mutate({
        filename: selectedFile.name,
      });

      if (!presignedUrlResponse.success || !presignedUrlResponse.url || !presignedUrlResponse.objectKey) {
        throw new Error(presignedUrlResponse.message || 'Nie udało się uzyskać adresu URL do przesłania pliku.');
      }
      const { url: presignedUrl, objectKey } = presignedUrlResponse;
      console.log('Received presigned URL:', presignedUrl);
      console.log('Object key:', objectKey);

      // Krok 2: Prześlij bezpośrednio do S3/MinIO używając URL
      console.log('Starting direct upload to S3/MinIO...');
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', presignedUrl, true);
        xhr.setRequestHeader('Content-Type', selectedFile.type); // Ustawienie Content-Type jest często wymagane

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Upload successful to S3/MinIO');
            setUploadProgress(100); // Upewnij się, że postęp jest na 100%
            resolve();
          } else {
            console.error('Upload to S3/MinIO failed. Status:', xhr.status, xhr.statusText);
            reject(new Error(`Błąd podczas przesyłania pliku: ${xhr.statusText || xhr.status}`));
          }
        };

        xhr.onerror = () => {
          console.error('Network error during upload to S3/MinIO.');
          reject(new Error('Błąd sieci podczas przesyłania pliku.'));
        };

        xhr.send(selectedFile);
      });

      // Krok 3: Poinformuj API Gateway o zakończeniu (tRPC)
      console.log('Notifying API about upload completion for objectKey:', objectKey);
      const notifyResponse = await trpc.notifyUploadComplete.mutate({ objectKey });
      console.log('Notification response:', notifyResponse);
      if (!notifyResponse.success || !notifyResponse.jobId) {
        throw new Error(notifyResponse.message || 'Nie udało się powiadomić serwera o zakończeniu przesyłania.');
      }
      console.log('Upload process complete. Job ID:', notifyResponse.jobId);

      onUploadComplete(notifyResponse.jobId); // Przekaż jobId z powrotem
      setSelectedFile(null); // Wyczyść wybór po pomyślnym przesłaniu
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Wystąpił błąd podczas przesyłania pliku.');
      // Reset progress on error
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        aria-label="Wybierz plik PDF"
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={handleUploadClick}
          disabled={isUploading}
          aria-label="Wybierz plik"
        >
          {selectedFile ? 'Zmień plik' : 'Wybierz plik'}
        </Button>
        {selectedFile && (
          <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
            {selectedFile.name} ({ (selectedFile.size / 1024 / 1024).toFixed(2) } MB)
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          aria-label="Rozpocznij przesyłanie"
        >
          {isUploading ? 'Przesyłanie...' : 'Prześlij'}
        </Button>
      </Box>
      {isUploading && (
        <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
    </Box>
  );
};

export default FileUpload; 