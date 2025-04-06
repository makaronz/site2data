const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  temperature: { type: Number, required: true },
  conditions: { type: String, required: true },
  windSpeed: { type: Number },
  precipitation: { type: String },
  notes: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Weather', weatherSchema); 