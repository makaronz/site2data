const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  color: { type: String, required: true },
  licensePlate: { type: String, required: true },
  owner: { type: String, required: true },
  contactInfo: { type: String, required: true },
  notes: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vehicle', vehicleSchema); 