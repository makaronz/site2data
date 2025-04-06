const mongoose = require('mongoose');

const shotSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  sceneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scene', required: true },
  shotNumber: { type: String, required: true },
  description: { type: String, required: true },
  cameraAngle: { type: String, required: true },
  cameraMovement: { type: String },
  lens: { type: String },
  lighting: { type: String },
  notes: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shot', shotSchema); 