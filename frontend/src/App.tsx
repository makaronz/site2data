import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Paper, Typography, CircularProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import PDFUpload from './components/PDFUpload';
import './App.css';

interface AnalysisResult {
  analysis: {
    metadata: {
      title: string;
      authors: string[];
      detected_language: string;
      scene_count: number;
      token_count: number;
      analysis_timestamp: string;
    };
    overall_summary: string;
  };
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(`ws://${window.location.host}/ws/script-analysis`);
    
    websocket.onopen = () => {
      console.log('WebSocket połączenie nawiązane');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ANALYSIS_RESULT') {
        setAnalysisResult(data.result);
        setAnalysisProgress('');
      } else if (data.type === 'PROGRESS') {
        setAnalysisProgress(data.message);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setAnalysisProgress('Błąd połączenia WebSocket');
    };

    websocket.onclose = () => {
      console.log('WebSocket połączenie zamknięte');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus('');
      setAnalysisProgress('');
      setAnalysisResult(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus('Proszę wybrać plik PDF');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('script', selectedFile);
    formData.append('type', 'pdf');

    try {
      const response = await fetch('/api/script/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setUploadStatus('Plik został pomyślnie przesłany!');
        setSelectedFile(null);
      } else {
        setUploadStatus(data.error || 'Wystąpił błąd podczas przesyłania pliku');
      }
    } catch (error) {
      setUploadStatus('Wystąpił błąd podczas połączenia z serwerem');
      console.error('Error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setAnalysisProgress('Błąd: Brak połączenia WebSocket');
      return;
    }

    ws.send(JSON.stringify({
      type: 'ANALYZE_SCRIPT',
      script: selectedFile
    }));
    setAnalysisProgress('Rozpoczynam analizę...');
  };

  const handleUploadSuccess = (text: string) => {
    setPdfText(text);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setPdfText('');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Analiza dokumentów PDF
        </h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <PDFUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {pdfText && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Zawartość dokumentu:
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
              {pdfText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 