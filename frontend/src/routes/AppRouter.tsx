import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

// Import views (these will be implemented later)
const SceneBreakdown = React.lazy(() => import('../views/SceneBreakdown'));
const CharacterMap = React.lazy(() => import('../views/CharacterMap'));
const LocationPlanner = React.lazy(() => import('../views/LocationPlanner'));
const ShootingPlanner = React.lazy(() => import('../views/ShootingPlanner'));
const ProductionRisks = React.lazy(() => import('../views/ProductionRisks'));
const PropsMatrix = React.lazy(() => import('../views/PropsMatrix'));
const NarrativePlayback = React.lazy(() => import('../views/NarrativePlayback'));
const LandingPage = React.lazy(() => import('../views/LandingPage'));
const AnalysisViewerPage = React.lazy(() => import('../views/AnalysisViewerPage')); // Import nowego widoku

/**
 * Main application router
 * 
 * Defines all routes for the application and wraps them in the AppLayout
 */
const AppRouter: React.FC = () => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <AppLayout>
        <Routes>
          {/* Landing page jako domyślna strona */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/analysis/:jobId" element={<AnalysisViewerPage />} /> {/* Dodana nowa ścieżka */}
          <Route path="/scene-breakdown" element={<SceneBreakdown />} />
          <Route path="/character-map" element={<CharacterMap />} />
          <Route path="/location-planner" element={<LocationPlanner />} />
          <Route path="/shooting-planner" element={<ShootingPlanner />} />
          <Route path="/production-risks" element={<ProductionRisks />} />
          <Route path="/props-matrix" element={<PropsMatrix />} />
          <Route path="/narrative-playback" element={<NarrativePlayback />} />
          
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </React.Suspense>
  );
};

export default AppRouter;
