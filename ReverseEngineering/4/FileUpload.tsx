import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface FileUploadProps {
  onUploadComplete: (objectKey: string) => void;
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
      // --- TODO: Step 1: Get Presigned URL from API Gateway (tRPC) ---
      // const presignedUrlResponse = await trpc.requestPresignedUrl.mutate({ filename: selectedFile.name });
      // if (!presignedUrlResponse.success) throw new Error(presignedUrlResponse.error);
      // const { url, objectKey } = presignedUrlResponse;
      const fakeObjectKey = `fake-${Date.now()}-${selectedFile.name}`;
      console.log('Fake Upload: Simulating getPresignedUrl');

      // --- TODO: Step 2: Upload directly to S3/MinIO using the URL ---
      // Use fetch or axios with PUT request to the presigned URL
      // Update progress using onUploadProgress (axios) or ReadableStream (fetch)
      console.log('Fake Upload: Simulating upload to S3/MinIO');
      // Simulate progress
      await new Promise(resolve => setTimeout(resolve, 500)); setUploadProgress(25);
      await new Promise(resolve => setTimeout(resolve, 500)); setUploadProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500)); setUploadProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500)); setUploadProgress(100);

      // --- TODO: Step 3: Notify API Gateway upon completion (tRPC) ---
      // await trpc.notifyUploadComplete.mutate({ objectKey });
      console.log('Fake Upload: Simulating notifyUploadComplete');

      onUploadComplete(fakeObjectKey); // Pass the object key back
      setSelectedFile(null); // Clear selection after successful upload
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Wystąpił błąd podczas przesyłania pliku.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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