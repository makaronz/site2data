const express = require('express');
const mongoose = require('mongoose');
import { Weapon, IWeapon } from '../models/weaponModel';

// Pomocnicze typy
type Request = any;
type Response = any;
type NextFunction = any;

// --- Kontrolery dla Broni ---

/**
 * Pobiera wszystkie bronie dla danego scenariusza.
 */
export const getAllWeaponsForScript = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }

        const weapons = await Weapon.find({ script_id: new mongoose.Types.ObjectId(scriptId) }).sort({ name: 1 });
        
        if (!weapons || weapons.length === 0) {
            return res.status(404).json({ message: 'Nie znaleziono broni dla tego scenariusza.' });
        }
        
        res.status(200).json(weapons);
    } catch (error) {
        console.error('[getAllWeaponsForScript] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania broni.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania broni.', error: errorMessage });
    }
};

/**
 * Pobiera pojedynczą broń na podstawie jej ID oraz ID scenariusza.
 */
export const getWeaponById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, weaponId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(weaponId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID broni.' });
        }

        const weapon = await Weapon.findOne({ _id: new mongoose.Types.ObjectId(weaponId), script_id: new mongoose.Types.ObjectId(scriptId) });
        
        if (!weapon) {
            return res.status(404).json({ message: 'Nie znaleziono broni.' });
        }
        
        res.status(200).json(weapon);
    } catch (error) {
        console.error('[getWeaponById] Błąd:', error);
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas pobierania broni.';
        res.status(500).json({ message: 'Błąd serwera podczas pobierania broni.', error: errorMessage });
    }
};

/**
 * Aktualizuje broń.
 * TODO: Dodać walidację Zod dla ciała żądania (req.body).
 */
export const updateWeapon = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scriptId, weaponId } = req.params;
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(scriptId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID scenariusza.' });
        }
        if (!mongoose.Types.ObjectId.isValid(weaponId)) {
            return res.status(400).json({ message: 'Nieprawidłowe ID broni.' });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Brak danych do aktualizacji.' });
        }

        // TODO: Implementacja walidacji Zod dla updateData

        const allowedUpdates: (keyof IWeapon)[] = [
            'name',
            'description',
            'type',
            'category',
            'caliber',
            'source_details',
            'safety_notes',
            'visual_references',
            'ai_notes',
            'user_notes'
            // scenes_ids będą prawdopodobnie aktualizowane przez inne procesy
        ];

        const finalUpdateData: Partial<IWeapon> = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                if (Weapon.schema && Weapon.schema.paths && key in Weapon.schema.paths) {
                    (finalUpdateData as any)[key] = updateData[key];
                }
            }
        }
        
        if (Object.keys(finalUpdateData).length === 0) {
            return res.status(400).json({ message: 'Brak dozwolonych pól do aktualizacji.' });
        }

        const updatedWeapon = await Weapon.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(weaponId), script_id: new mongoose.Types.ObjectId(scriptId) },
            { $set: finalUpdateData }, 
            { new: true, runValidators: true }
        );

        if (!updatedWeapon) {
            return res.status(404).json({ message: 'Nie znaleziono broni do aktualizacji lub nie należy ona do tego scenariusza.' });
        }

        res.status(200).json(updatedWeapon);
    } catch (error) {
        console.error('[updateWeapon] Błąd:', error);
        if (mongoose && mongoose.Error && error instanceof mongoose.Error.ValidationError) {
            const validationError = error as any;
            return res.status(400).json({ 
                message: 'Błąd walidacji Mongoose.', 
                errors: validationError.errors 
            });
        }
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd serwera podczas aktualizacji broni.';
        res.status(500).json({ message: 'Błąd serwera podczas aktualizacji broni.', error: errorMessage });
    }
}; 