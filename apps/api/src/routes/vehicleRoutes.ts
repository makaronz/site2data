const express = require('express');
import * as vehicleController from '../controllers/vehicleController';

const router = express.Router();

// --- Trasy dla Pojazdów ---

// Pobierz wszystkie pojazdy dla danego scenariusza
router.get('/scripts/:scriptId/vehicles', vehicleController.getAllVehiclesForScript);

// Pobierz pojedynczy pojazd
router.get('/scripts/:scriptId/vehicles/:vehicleId', vehicleController.getVehicleById);

// Zaktualizuj pojazd
router.patch('/scripts/:scriptId/vehicles/:vehicleId', vehicleController.updateVehicle);

export default router; 