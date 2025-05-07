const express = require('express');
import * as sceneController from '../controllers/sceneController';

const router = express.Router();

// --- Trasy dla Scen ---

// Pobierz wszystkie sceny dla danego scenariusza
router.get('/scripts/:scriptId/scenes', sceneController.getAllScenesForScript);

// Pobierz pojedynczą scenę
router.get('/scripts/:scriptId/scenes/:sceneId', sceneController.getSceneById);

// Zaktualizuj scenę
router.patch('/scripts/:scriptId/scenes/:sceneId', sceneController.updateScene);

export default router; 