import React, { useState, forwardRef, useImperativeHandle } from 'react';
import type { AnalysisResult } from '../types';
import SceneModal from './modals/SceneModal';
import CharacterModal from './modals/CharacterModal';
import LocationModal from './modals/LocationModal';

export type ModalType = 'scene' | 'character' | 'location' | null;

export interface ModalManagerProps {
  analysisResult: AnalysisResult;
}

export interface ModalManagerHandle {
  openModal: (type: ModalType, id: string) => void;
  closeModal: () => void;
}

const ModalManager = forwardRef<ModalManagerHandle, ModalManagerProps>(
  ({ analysisResult }, ref) => {
    const [modalType, setModalType] = useState<ModalType>(null);
    const [modalId, setModalId] = useState<string>('');
    const [open, setOpen] = useState(false);

    // Funkcje do zarządzania stanem modali
    const openModal = (type: ModalType, id: string) => {
      setModalType(type);
      setModalId(id);
      setOpen(true);
    };

    const closeModal = () => {
      setOpen(false);
      // Resetujemy typ i id dopiero po zamknięciu modala (opcjonalne, dla czystości stanu)
      setTimeout(() => {
        setModalType(null);
        setModalId('');
      }, 300);
    };

    // Udostępnienie funkcji openModal i closeModal poprzez ref
    useImperativeHandle(ref, () => ({
      openModal,
      closeModal
    }));

    // Renderowanie odpowiedniego modala na podstawie typu
    return (
      <>
        {modalType === 'scene' && (
          <SceneModal
            open={open}
            onClose={closeModal}
            sceneId={modalId}
            analysisResult={analysisResult}
          />
        )}
        
        {modalType === 'character' && (
          <CharacterModal
            open={open}
            onClose={closeModal}
            character={modalId}
            analysisResult={analysisResult}
          />
        )}
        
        {modalType === 'location' && (
          <LocationModal
            open={open}
            onClose={closeModal}
            location={modalId}
            analysisResult={analysisResult}
          />
        )}
      </>
    );
  }
);

ModalManager.displayName = 'ModalManager';

export default ModalManager; 