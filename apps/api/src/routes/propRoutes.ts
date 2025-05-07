const express = require('express');
import * as propController from '../controllers/propController';

const router = express.Router();

// --- Trasy dla Rekwizytów ---

// Pobierz wszystkie rekwizyty dla danego scenariusza
router.get('/scripts/:scriptId/props', propController.getAllPropsForScript);

// Pobierz pojedynczy rekwizyt
router.get('/scripts/:scriptId/props/:propId', propController.getPropById);

// Zaktualizuj rekwizyt
router.patch('/scripts/:scriptId/props/:propId', propController.updateProp);

export default router; 