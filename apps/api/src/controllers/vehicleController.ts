const express = require('express');
const mongoose = require('mongoose');
import { Vehicle, IVehicle } from '../models/vehicleModel';

// Pomocnicze typy
type Request = any;
type Response = any;
type NextFunction = any;

// --- Kontrolery dla Pojazdów ---

/**
 * Pobiera wszystkie pojazdy dla danego scenariusza.
 */
export const getAllVehiclesForScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }

        const vehicles = await Vehicle.find({ script_id: new mongoose.Types.ObjectId(scriptId) }).sort({ name: 1 });
        
        if (!vehicles || vehicles.length === 0) {
            return res.status(404).json({ message: 'Nie znaleziono pojazdów dla tego scenariusza.' });
        }
        
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('[getAllVehiclesForScript] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania pojazdów.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania pojazdów.', error: errorMessage });
    }
};

/**
 * Pobiera pojedynczy pojazd na podstawie jego ID oraz ID scenariusza.
 */
export const getVehicleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, vehicleId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID pojazdu.' });
        }

        const vehicle = await Vehicle.findOne({ _id: new mongoose.Types.ObjectId(vehicleId), script_id: new mongoose.Types.ObjectId(scriptId) });
        
        if (!vehicle) {
            return res.status(404).json({ message: 'Nie znaleziono pojazdu.' });
        }
        
        res.status(200).json(vehicle);
    } catch (error) {
        console.error('[getVehicleById] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania pojazdu.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania pojazdu.', error: errorMessage });
    }
};

/**
 * Aktualizuje pojazd.
 * TODO: Dodać walidację Zod dla ciała żądania (req.body).
 */
export const updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, vehicleId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID pojazdu.' });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Brak danych do aktualizacji.' });
        }

        // TODO: Implementacja walidacji Zod dla updateData

        const allowedUpdates: (keyof IVehicle)[] = [
            'name',
            'description',
            'type',
            'visual_characteristics',
            'availability_status',
            'source_details',
            'action_props',
            'ai_notes',
            'user_notes'
            // scenes_ids będą prawdopodobnie aktualizowane przez inne procesy
        ];

        const finalUpdateData: Partial<IVehicle> = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                if (Vehicle.schema && Vehicle.schema.paths && key in Vehicle.schema.paths) {
                    (finalUpdateData as any)[key] = updateData[key];
                }
            }
        }
        
        if (Object.keys(finalUpdateData).length === 0) {
            return res.status(400).json({ message: 'Brak dozwolonych pól do aktualizacji.' });
        }

        const updatedVehicle = await Vehicle.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(vehicleId), script_id: new mongoose.Types.ObjectId(scriptId) },
            { $set: finalUpdateData }, 
            { new: true, runValidators: true }
        );

        if (!updatedVehicle) {
            return res.status(404).json({ message: 'Nie znaleziono pojazdu do aktualizacji lub nie należy on do tego scenariusza.' });
        }

        res.status(200).json(updatedVehicle);
    } catch (error) {
        console.error('[updateVehicle] Błąd:', error);
        if (mongoose && mongoose.Error && error instanceof mongoose.Error.ValidationError) {
            const validationError = error as any;
            return res.status(400).json({ 
                message: 'Błąd walidacji Mongoose.', 
                errors: validationError.errors 
            });
        }
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas aktualizacji pojazdu.';
        res.status(500).json({ message: 'Błąd serwera podczas aktualizacji pojazdu.', error: errorMessage });
    }
}; 