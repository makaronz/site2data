const ScriptParser = require('../utils/scriptParser');
const Script = require('../models/ScriptModel');
const fs = require('fs');
const path = require('path');

class ScriptController {
  async parseScript(req, res) {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'Nie podano ścieżki do pliku scenariusza'
        });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Plik scenariusza nie istnieje'
        });
      }

      const scriptParser = new ScriptParser();
      const parsedScript = await scriptParser.parse(filePath);
      
      // Zapisz sparsowany scenariusz w bazie danych
      const script = new Script(parsedScript);
      await script.save();

      res.status(200).json({
        success: true,
        message: 'Scenariusz został pomyślnie sparsowany i zapisany',
        data: script
      });
    } catch (error) {
      console.error('Błąd podczas parsowania scenariusza:', error);
      res.status(500).json({
        success: false,
        message: 'Wystąpił błąd podczas parsowania scenariusza',
        error: error.message
      });
    }
  }

  async getScripts(req, res) {
    try {
      const scripts = await Script.find()
        .select('title version date metadata')
        .sort('-date');

      res.status(200).json({
        success: true,
        data: scripts
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas pobierania listy scenariuszy',
        error: error.message
      });
    }
  }

  async getScriptById(req, res) {
    try {
      const { id } = req.params;
      const script = await Script.findById(id);

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Scenariusz nie został znaleziony'
        });
      }

      res.status(200).json({
        success: true,
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas pobierania scenariusza',
        error: error.message
      });
    }
  }

  async updateScript(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const script = await Script.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
      });

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Scenariusz nie został znaleziony'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Scenariusz został zaktualizowany',
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas aktualizacji scenariusza',
        error: error.message
      });
    }
  }

  async deleteScript(req, res) {
    try {
      const { id } = req.params;
      const script = await Script.findByIdAndDelete(id);

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Scenariusz nie został znaleziony'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Scenariusz został usunięty',
        data: script
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas usuwania scenariusza',
        error: error.message
      });
    }
  }

  async getScriptStatistics(req, res) {
    try {
      const { id } = req.params;
      const script = await Script.findById(id);

      if (!script) {
        return res.status(404).json({
          success: false,
          message: 'Scenariusz nie został znaleziony'
        });
      }

      const statistics = {
        totalScenes: script.metadata.totalScenes,
        totalCharacters: script.metadata.uniqueCharacters.length,
        totalDialogues: script.metadata.totalDialogues,
        scenesByTimeOfDay: {},
        scenesByLocationType: {},
        charactersWithMostDialogues: []
      };

      // Oblicz statystyki dla pory dnia
      script.scenes.forEach(scene => {
        statistics.scenesByTimeOfDay[scene.timeOfDay] = 
          (statistics.scenesByTimeOfDay[scene.timeOfDay] || 0) + 1;
        
        statistics.scenesByLocationType[scene.location.type] = 
          (statistics.scenesByLocationType[scene.location.type] || 0) + 1;
      });

      // Oblicz statystyki dialogów dla postaci
      const characterDialogues = {};
      script.scenes.forEach(scene => {
        scene.dialogue.forEach(d => {
          characterDialogues[d.character] = 
            (characterDialogues[d.character] || 0) + 1;
        });
      });

      statistics.charactersWithMostDialogues = Object.entries(characterDialogues)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([character, count]) => ({ character, dialogueCount: count }));

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Błąd podczas pobierania statystyk',
        error: error.message
      });
    }
  }
}

module.exports = new ScriptController();