const express = require('express');
import * as locationController from '../controllers/locationController';

const router = express.Router();

// --- Trasy dla Lokacji ---

// Pobierz wszystkie lokacje dla danego scenariusza
router.get('/scripts/:scriptId/locations', locationController.getAllLocationsForScript);

// Pobierz pojedynczą lokację
router.get('/scripts/:scriptId/locations/:locationId', locationController.getLocationById);

// Zaktualizuj lokację
router.patch('/scripts/:scriptId/locations/:locationId', locationController.updateLocation);

export default router; 