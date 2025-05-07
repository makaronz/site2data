const express = require('express');
import * as characterController from '../controllers/characterController';

const router = express.Router();

// --- Trasy dla Postaci ---

// Pobierz wszystkie postacie dla danego scenariusza
router.get('/scripts/:scriptId/characters', characterController.getAllCharactersForScript);

// Pobierz pojedynczą postać
router.get('/scripts/:scriptId/characters/:characterId', characterController.getCharacterById);

// Zaktualizuj postać
router.patch('/scripts/:scriptId/characters/:characterId', characterController.updateCharacter);

export default router; 