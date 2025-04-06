const mongoose = require('mongoose');

const dialogueSchema = new mongoose.Schema({
  character: { type: String, required: true },
  text: { type: String, required: true }
});

const locationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true }
});

const propSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  quantity: Number
});

const vehicleSchema = new mongoose.Schema({
  type: { type: String, required: true },
  description: String,
  quantity: Number
});

const extraSchema = new mongoose.Schema({
  type: { type: String, required: true },
  quantity: Number,
  description: String
});

const sceneSchema = new mongoose.Schema({
  sceneNumber: { type: String, required: true },
  location: { type: locationSchema, required: true },
  timeOfDay: { type: String, required: true },
  cast: [{ type: String }],
  dialogue: [dialogueSchema],
  props: [propSchema],
  vehicles: [vehicleSchema],
  extras: [extraSchema],
  specialRequirements: [String],
  description: String
});

const scriptSchema = new mongoose.Schema({
  title: { type: String, required: true },
  version: { type: String, required: true },
  date: { type: Date, default: Date.now },
  scenes: [sceneSchema],
  metadata: {
    totalScenes: Number,
    uniqueCharacters: [String],
    totalDialogues: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Script', scriptSchema); 