import React, { useState } from 'react';
import axios from 'axios';

interface AnalysisProgress {
  stage: string;
  percentage: number;
  message: string;
}

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
    scenes: Array<{
      id: string;
      location: string;
      time: string;
      characters: string[];
      summary: string;
      dominant_emotions: {
        joy: number;
        trust: number;
        fear: number;
        surprise: number;
        sadness: number;
        disgust: number;
        anger: number;
        anticipation: number;
      };
      narrative_importance: number;
    }>;
    characters: Array<{
      name: string;
      role: 'protagonist' | 'antagonist' | 'supporting' | 'other';
      description: string;
      emotional_profile: {
        joy: number;
        trust: number;
        fear: number;
        surprise: number;
        sadness: number;
        disgust: number;
        anger: number;
        anticipation: number;
      };
      centrality_score: number;
      arc_type: string;
    }>;
    relationships: Array<{
      character_a: string;
      character_b: string;
      strength: number;
      overall_sentiment: number;
      key_scenes: string[];
    }>;
    turning_points: Array<{
      scene_id: string;
      type: 'inciting' | 'midpoint' | 'climax' | 'resolution' | 'other';
      intensity: number;
      impact_summary: string;
    }>;
    themes: Array<{
      theme: string;
      relevance: number;
    }>;
    topic_clusters: Array<{
      topic: string;
      keywords: string[];
      frequency: number;
    }>;
    emotional_timeline: Array<{
      scene_id: string;
      valence: number;
      arousal: number;
    }>;
    overall_summary: string;
  };
  locations: string[];
  roles: Array<{
    character: string;
    role: string;
  }>;
  props: string[];
  vehicles: string[];
  special_effects: string[];
  weapons: string[];
  difficult_scenes: Array<{
    scene_id: string;
    reason: string;
    gear_needed: string[];
  }>;
}

export const PdfAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({
    stage: 'idle',
    percentage: 0,
    message: 'Gotowy do analizy'
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);

    let ws: WebSocket | null = null;

    try {
      setProgress({
        stage: 'uploading',
        percentage: 0,
        message: 'Rozpoczynam przesyłanie pliku...'
      });

      // Najpierw nawiązujemy połączenie WebSocket
      ws = new WebSocket(`ws://${window.location.host}/ws/script-analysis`);
      
      ws.onopen = () => {
        console.log('WebSocket połączenie nawiązane');
      };

      ws.onerror = (error) => {
        console.error('WebSocket błąd:', error);
        setProgress({
          stage: 'error',
          percentage: 0,
          message: 'Błąd połączenia WebSocket'
        });
      };

      ws.onclose = () => {
        console.log('WebSocket połączenie zamknięte');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProgress({
            stage: data.stage,
            percentage: data.percentage,
            message: data.message
          });

          if (data.stage === 'completed') {
            setResult(data.result);
            ws?.close();
          }
        } catch (error) {
          console.error('Błąd przetwarzania wiadomości WebSocket:', error);
        }
      };

      // Następnie wysyłamy plik
      const response = await axios.post('/api/script/analyze', formData, {
        onUploadProgress: (progressEvent) => {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setProgress({
            stage: 'uploading',
            percentage,
            message: `Przesyłanie pliku: ${percentage}%`
          });
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Błąd analizy pliku');
      }

    } catch (error) {
      console.error('Błąd podczas przetwarzania:', error);
      setProgress({
        stage: 'error',
        percentage: 0,
        message: 'Wystąpił błąd podczas analizy: ' + (error instanceof Error ? error.message : 'Nieznany błąd')
      });
      ws?.close();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Analiza Skryptu PDF</h2>
      
      <div className="mb-4">
        <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 mb-2">
          Wybierz plik PDF ze skryptem
        </label>
        <input
          id="pdf-upload"
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!file || progress.stage === 'analyzing'}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
      >
        {progress.stage === 'analyzing' ? 'Analizuję...' : 'Analizuj'}
      </button>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">{progress.message}</p>
      </div>

      {/* Results display */}
      {result && (
        <div className="mt-8 space-y-6">
          <h3 className="text-xl font-semibold">Wyniki Analizy</h3>
          
          {/* Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Metadane</h4>
            <p>Tytuł: {result.analysis.metadata.title}</p>
            <p>Liczba scen: {result.analysis.metadata.scene_count}</p>
            <p>Język: {result.analysis.metadata.detected_language}</p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Lokacje ({result.locations.length})</h4>
              <ul className="list-disc list-inside">
                {result.locations.slice(0, 5).map((loc, i) => (
                  <li key={i}>{loc}</li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Postacie ({result.roles.length})</h4>
              <ul className="list-disc list-inside">
                {result.roles.slice(0, 5).map((role, i) => (
                  <li key={i}>{role.character} - {role.role}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Difficult scenes */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Trudne sceny</h4>
            <div className="space-y-2">
              {result.difficult_scenes.map((scene, i) => (
                <div key={i} className="border-l-4 border-yellow-500 pl-3">
                  <p className="font-medium">Scena {scene.scene_id}</p>
                  <p className="text-sm text-gray-600">Powód: {scene.reason}</p>
                  <p className="text-sm text-gray-600">
                    Potrzebny sprzęt: {scene.gear_needed.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Download buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(result.analysis, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'analysis.json';
                a.click();
              }}
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Pobierz pełną analizę
            </button>
            <button
              onClick={() => {
                const allData = {
                  locations: result.locations,
                  roles: result.roles,
                  props: result.props,
                  vehicles: result.vehicles,
                  special_effects: result.special_effects,
                  weapons: result.weapons,
                  difficult_scenes: result.difficult_scenes
                };
                const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'production_data.json';
                a.click();
              }}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Pobierz dane produkcyjne
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 