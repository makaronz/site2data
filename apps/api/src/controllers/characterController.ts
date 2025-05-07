const express = require('express');
const mongoose = require('mongoose');
import { Character, ICharacter } from '../models/characterModel';

// Pomocnicze typy (zgodnie z wcześniejszymi poprawkami)
type Request = any;
type Response = any;
type NextFunction = any;

// --- Kontrolery dla Postaci ---

/**
 * Pobiera wszystkie postacie dla danego scenariusza.
 */
export const getAllCharactersForScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }

        const characters = await Character.find({ script_id: new mongoose.Types.ObjectId(scriptId) }).sort({ name: 1 });
        
        if (!characters || characters.length === 0) {
            return res.status(404).json({ message: 'Nie znaleziono postaci dla tego scenariusza.' });
        }
        
        res.status(200).json(characters);
    } catch (error) {
        console.error('[getAllCharactersForScript] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania postaci.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania postaci.', error: errorMessage });
    }
};

/**
 * Pobiera pojedynczą postać na podstawie jej ID oraz ID scenariusza.
 */
export const getCharacterById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, characterId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(characterId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID postaci.' });
        }

        const character = await Character.findOne({ _id: new mongoose.Types.ObjectId(characterId), script_id: new mongoose.Types.ObjectId(scriptId) });
        
        if (!character) {
            return res.status(404).json({ message: 'Nie znaleziono postaci.' });
        }
        
        res.status(200).json(character);
    } catch (error) {
        console.error('[getCharacterById] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania postaci.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania postaci.', error: errorMessage });
    }
};

/**
 * Aktualizuje postać.
 * TODO: Dodać walidację Zod dla ciała żądania (req.body).
 */
export const updateCharacter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, characterId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(characterId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID postaci.' });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Brak danych do aktualizacji.' });
        }

        // TODO: Implementacja walidacji Zod dla updateData

        const allowedUpdates: (keyof ICharacter)[] = [
            'name',
            'description',
            'character_arc_notes',
            'relationships', // Aktualizacja całego obiektu relationships
            'ai_notes',
            'user_notes'
            // first_scene_id, last_scene_id, scenes_ids będą prawdopodobnie aktualizowane przez inne procesy
        ];

        const finalUpdateData: Partial<ICharacter> = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                // Bezpieczne przypisanie z kontrolą typów (zakładając, że Character.schema.paths istnieje i jest poprawne)
                if (Character.schema && Character.schema.paths && key in Character.schema.paths) {
                    (finalUpdateData as any)[key] = updateData[key];
                }
            }
        }
        
        // Obsługa specyficznych pól jak 'relationships' może wymagać bardziej złożonej logiki,
        // np. aktualizacji poszczególnych elementów tablicy zamiast nadpisywania całości.
        // Na razie zakładamy proste nadpisanie, jeśli pole 'relationships' jest w `allowedUpdates`.

        if (Object.keys(finalUpdateData).length === 0) {
            return res.status(400).json({ message: 'Brak dozwolonych pól do aktualizacji.' });
        }

        const updatedCharacter = await Character.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(characterId), script_id: new mongoose.Types.ObjectId(scriptId) },
            { $set: finalUpdateData }, 
            { new: true, runValidators: true }
        );

        if (!updatedCharacter) {
            return res.status(404).json({ message: 'Nie znaleziono postaci do aktualizacji lub nie należy ona do tego scenariusza.' });
        }

        res.status(200).json(updatedCharacter);
    } catch (error) {
        console.error('[updateCharacter] Błąd:', error);
        // Poprawiona obsługa błędu walidacji Mongoose, zakładając, że `mongoose.Error.ValidationError` jest dostępne
        if (mongoose && mongoose.Error && error instanceof mongoose.Error.ValidationError) {
            const validationError = error as any; // Rzutowanie, aby uniknąć problemów z typowaniem, jeśli typy nie są w pełni rozpoznane
            return res.status(400).json({ 
                message: 'Błąd walidacji Mongoose.', 
                errors: validationError.errors 
            });
        }
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas aktualizacji postaci.';
        res.status(500).json({ message: 'Błąd serwera podczas aktualizacji postaci.', error: errorMessage });
    }
}; 