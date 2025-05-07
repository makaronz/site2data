const express = require('express');
const mongoose = require('mongoose');
import { Prop, IProp } from '../models/propModel';

// Pomocnicze typy
type Request = any;
type Response = any;
type NextFunction = any;

// --- Kontrolery dla Rekwizytów ---

/**
 * Pobiera wszystkie rekwizyty dla danego scenariusza.
 */
export const getAllPropsForScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }

        const props = await Prop.find({ script_id: new mongoose.Types.ObjectId(scriptId) }).sort({ name: 1 });
        
        if (!props || props.length === 0) {
            return res.status(404).json({ message: 'Nie znaleziono rekwizytów dla tego scenariusza.' });
        }
        
        res.status(200).json(props);
    } catch (error) {
        console.error('[getAllPropsForScript] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania rekwizytów.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania rekwizytów.', error: errorMessage });
    }
};

/**
 * Pobiera pojedynczy rekwizyt na podstawie jego ID oraz ID scenariusza.
 */
export const getPropById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, propId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(propId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID rekwizytu.' });
        }

        const prop = await Prop.findOne({ _id: new mongoose.Types.ObjectId(propId), script_id: new mongoose.Types.ObjectId(scriptId) });
        
        if (!prop) {
            return res.status(404).json({ message: 'Nie znaleziono rekwizytu.' });
        }
        
        res.status(200).json(prop);
    } catch (error) {
        console.error('[getPropById] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania rekwizytu.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania rekwizytu.', error: errorMessage });
    }
};

/**
 * Aktualizuje rekwizyt.
 * TODO: Dodać walidację Zod dla ciała żądania (req.body).
 */
export const updateProp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, propId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(propId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID rekwizytu.' });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Brak danych do aktualizacji.' });
        }

        // TODO: Implementacja walidacji Zod dla updateData

        const allowedUpdates: (keyof IProp)[] = [
            'name',
            'description',
            'category',
            'quantity',
            'availability_status',
            'source_details',
            'visual_references',
            'placement_notes',
            'ai_notes',
            'user_notes'
            // scenes_ids będą prawdopodobnie aktualizowane przez inne procesy
        ];

        const finalUpdateData: Partial<IProp> = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                if (Prop.schema && Prop.schema.paths && key in Prop.schema.paths) {
                    (finalUpdateData as any)[key] = updateData[key];
                }
            }
        }
        
        if (Object.keys(finalUpdateData).length === 0) {
            return res.status(400).json({ message: 'Brak dozwolonych pól do aktualizacji.' });
        }

        const updatedProp = await Prop.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(propId), script_id: new mongoose.Types.ObjectId(scriptId) },
            { $set: finalUpdateData }, 
            { new: true, runValidators: true }
        );

        if (!updatedProp) {
            return res.status(404).json({ message: 'Nie znaleziono rekwizytu do aktualizacji lub nie należy on do tego scenariusza.' });
        }

        res.status(200).json(updatedProp);
    } catch (error) {
        console.error('[updateProp] Błąd:', error);
        if (mongoose && mongoose.Error && error instanceof mongoose.Error.ValidationError) {
            const validationError = error as any;
            return res.status(400).json({ 
                message: 'Błąd walidacji Mongoose.', 
                errors: validationError.errors 
            });
        }
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas aktualizacji rekwizytu.';
        res.status(500).json({ message: 'Błąd serwera podczas aktualizacji rekwizytu.', error: errorMessage });
    }
}; 