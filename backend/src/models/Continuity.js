const mongoose = require('mongoose');

const continuitySchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  sceneNumber: { type: String, required: true },
  shotNumber: { type: String, required: true },
  description: { type: String, required: true },
  props: [{ type: String }],
  costumes: [{ type: String }],
  makeup: [{ type: String }],
  hair: [{ type: String }],
  setDressing: [{ type: String }],
  notes: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Continuity', continuitySchema); 