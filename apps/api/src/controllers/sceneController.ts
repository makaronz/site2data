const express = require('express');
const mongoose = require('mongoose');
import { Scene, IScene } from '../models/sceneModel';

// Pomocnicze typy
type Request = any;
type Response = any;
type NextFunction = any;

// --- Kontrolery dla Scen ---

/**
 * Pobiera wszystkie sceny dla danego scenariusza.
 */
export const getAllScenesForScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }

        const scenes = await Scene.find({ script_id: new mongoose.Types.ObjectId(scriptId) }).sort({ scene_number: 1 });
        
        if (!scenes || scenes.length === 0) {
            return res.status(404).json({ message: 'Nie znaleziono scen dla tego scenariusza.' });
        }
        
        res.status(200).json(scenes);
    } catch (error) {
        console.error('[getAllScenesForScript] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania scen.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania scen.', error: errorMessage });
    }
};

/**
 * Pobiera pojedynczą scenę na podstawie jej ID oraz ID scenariusza.
 */
export const getSceneById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, sceneId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(sceneId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID sceny.' });
        }

        const scene = await Scene.findOne({ _id: new mongoose.Types.ObjectId(sceneId), script_id: new mongoose.Types.ObjectId(scriptId) });
        
        if (!scene) {
            return res.status(404).json({ message: 'Nie znaleziono sceny.' });
        }
        
        res.status(200).json(scene);
    } catch (error) {
        console.error('[getSceneById] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania sceny.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania sceny.', error: errorMessage });
    }
};

/**
 * Aktualizuje scenę.
 * Na razie pozwala na aktualizację tylko wybranych pól.
 * TODO: Dodać walidację Zod dla ciała żądania (req.body).
 */
export const updateScene = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, sceneId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(sceneId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID sceny.' });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Brak danych do aktualizacji.' });
        }

        const allowedUpdates: (keyof IScene)[] = [
            'title',
            'description',
            'int_ext',
            'day_time',
            'estimated_length_tag',
            'content',
            'risk_tags',
            'mood',
        ];

        const finalUpdateData: Partial<IScene> = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                if (key in Scene.schema.paths) {
                    (finalUpdateData as any)[key] = updateData[key];
                }
            }
        }

        if (updateData.lighting_info && typeof updateData.lighting_info === 'object') {
            finalUpdateData.lighting_info = { ...(finalUpdateData.lighting_info || {}), ...updateData.lighting_info };
        }
        if (updateData.production_checklist && typeof updateData.production_checklist === 'object') {
            finalUpdateData.production_checklist = { ...(finalUpdateData.production_checklist || {}), ...updateData.production_checklist };
        }

        if (Object.keys(finalUpdateData).length === 0) {
            return res.status(400).json({ message: 'Brak dozwolonych pól do aktualizacji.' });
        }

        const updatedScene = await Scene.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(sceneId), script_id: new mongoose.Types.ObjectId(scriptId) },
            { $set: finalUpdateData }, 
            { new: true, runValidators: true }
        );

        if (!updatedScene) {
            return res.status(404).json({ message: 'Nie znaleziono sceny do aktualizacji lub nie należy ona do tego scenariusza.' });
        }

        res.status(200).json(updatedScene);
    } catch (error) {
        console.error('[updateScene] Błąd:', error);
        if (mongoose && mongoose.Error && error instanceof mongoose.Error.ValidationError) {
            // Rzutujemy na any, aby uniknąć problemów z typowaniem
            const validationError = error as any;
            return res.status(400).json({ 
                message: 'Błąd walidacji Mongoose.', 
                errors: validationError.errors 
            });
        }
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas aktualizacji sceny.';
        res.status(500).json({ message: 'Błąd serwera podczas aktualizacji sceny.', error: errorMessage });
    }
}; 