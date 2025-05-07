const express = require('express');
const mongoose = require('mongoose');
import { Location, ILocation } from '../models/locationModel';

// Pomocnicze typy
type Request = any;
type Response = any;
type NextFunction = any;

// --- Kontrolery dla Lokacji ---

/**
 * Pobiera wszystkie lokacje dla danego scenariusza.
 */
export const getAllLocationsForScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }

        const locations = await Location.find({ script_id: new mongoose.Types.ObjectId(scriptId) }).sort({ name: 1 });
        
        if (!locations || locations.length === 0) {
            return res.status(404).json({ message: 'Nie znaleziono lokacji dla tego scenariusza.' });
        }
        
        res.status(200).json(locations);
    } catch (error) {
        console.error('[getAllLocationsForScript] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania lokacji.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania lokacji.', error: errorMessage });
    }
};

/**
 * Pobiera pojedynczą lokację na podstawie jej ID oraz ID scenariusza.
 */
export const getLocationById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, locationId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(locationId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID lokacji.' });
        }

        const location = await Location.findOne({ _id: new mongoose.Types.ObjectId(locationId), script_id: new mongoose.Types.ObjectId(scriptId) });
        
        if (!location) {
            return res.status(404).json({ message: 'Nie znaleziono lokacji.' });
        }
        
        res.status(200).json(location);
    } catch (error) {
        console.error('[getLocationById] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania lokacji.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania lokacji.', error: errorMessage });
    }
};

/**
 * Aktualizuje lokację.
 * TODO: Dodać walidację Zod dla ciała żądania (req.body).
 */
export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, locationId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(locationId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID lokacji.' });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Brak danych do aktualizacji.' });
        }

        // TODO: Implementacja walidacji Zod dla updateData

        const allowedUpdates: (keyof ILocation)[] = [
            'name',
            'description',
            'type',
            'address_details',
            'technical_requirements',
            'logistic_notes',
            'ai_notes',
            'user_notes'
            // scenes_ids będą prawdopodobnie aktualizowane przez inne procesy
        ];

        const finalUpdateData: Partial<ILocation> = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                if (Location.schema && Location.schema.paths && key in Location.schema.paths) {
                    (finalUpdateData as any)[key] = updateData[key];
                }
            }
        }
        
        if (Object.keys(finalUpdateData).length === 0) {
            return res.status(400).json({ message: 'Brak dozwolonych pól do aktualizacji.' });
        }

        const updatedLocation = await Location.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(locationId), script_id: new mongoose.Types.ObjectId(scriptId) },
            { $set: finalUpdateData }, 
            { new: true, runValidators: true }
        );

        if (!updatedLocation) {
            return res.status(404).json({ message: 'Nie znaleziono lokacji do aktualizacji lub nie należy ona do tego scenariusza.' });
        }

        res.status(200).json(updatedLocation);
    } catch (error) {
        console.error('[updateLocation] Błąd:', error);
        if (mongoose && mongoose.Error && error instanceof mongoose.Error.ValidationError) {
            const validationError = error as any;
            return res.status(400).json({ 
                message: 'Błąd walidacji Mongoose.', 
                errors: validationError.errors 
            });
        }
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas aktualizacji lokacji.';
        res.status(500).json({ message: 'Błąd serwera podczas aktualizacji lokacji.', error: errorMessage });
    }
}; 