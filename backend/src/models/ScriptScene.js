const mongoose = require('mongoose');

const scriptSceneSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  sceneNumber: { type: String, required: true },
  version: { type: String, required: true },
  timeOfDay: {
    type: String,
    enum: ['DZIEŃ', 'NOC', 'ŚWIT', 'ZMIERZCH', 'WSCHÓD', 'ZACHÓD'],
    required: true
  },
  location: {
    type: { type: String, enum: ['INT', 'EXT', 'INT/EXT', 'EXT/INT'], required: true },
    name: { type: String, required: true },
    description: String
  },
  cast: [{
    characterName: { type: String, required: true },
    actorName: String,
    type: { type: String, enum: ['GŁÓWNA ROLA', 'EPIZOD', 'STATYSTA'] },
    costume: [{
      description: String,
      number: String,
      state: String,
      notes: String
    }]
  }],
  extras: {
    count: Number,
    description: String,
    costumes: String
  },
  vehicles: [{
    type: String,
    description: String,
    quantity: Number,
    specialRequirements: String
  }],
  props: [{
    name: String,
    description: String,
    quantity: Number,
    state: String,
    handledBy: [String] // Lista postaci używających rekwizytu
  }],
  specialRequirements: [{
    category: { 
      type: String, 
      enum: ['SFX', 'KASKADERZY', 'ZWIERZĘTA', 'PIROTECHNIKA', 'INNE']
    },
    description: String,
    notes: String
  }],
  notes: String,
  continuityNotes: String,
  weather: {
    description: String,
    requirements: String
  },
  estimatedDuration: Number, // w minutach
  status: {
    type: String,
    enum: ['NIEZREALIZOWANA', 'W TRAKCIE', 'ZREALIZOWANA', 'USUNIĘTA'],
    default: 'NIEZREALIZOWANA'
  },
  lastModified: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ScriptScene', scriptSceneSchema); 