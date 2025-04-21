const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  quantity: { type: Number, required: true },
  condition: { type: String, required: true },
  assignedTo: { type: String },
  location: { type: String },
  notes: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Equipment', equipmentSchema); 