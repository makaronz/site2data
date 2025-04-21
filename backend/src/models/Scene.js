const mongoose = require('mongoose');

const sceneSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  sceneNumber: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  cast: [{ type: String }],
  props: [{ type: String }],
  notes: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scene', sceneSchema); 