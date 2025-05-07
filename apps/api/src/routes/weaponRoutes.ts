const express = require('express');
import * as weaponController from '../controllers/weaponController';

const router = express.Router();

// --- Trasy dla Broni ---

// Pobierz wszystkie bronie dla danego scenariusza
router.get('/scripts/:scriptId/weapons', weaponController.getAllWeaponsForScript);

// Pobierz pojedynczą broń
router.get('/scripts/:scriptId/weapons/:weaponId', weaponController.getWeaponById);

// Zaktualizuj broń
router.patch('/scripts/:scriptId/weapons/:weaponId', weaponController.updateWeapon);

export default router; 