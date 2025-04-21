const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  director: { type: String, required: true },
  producer: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, required: true },
  budget: { type: Number, required: true },
  location: { type: String, required: true },
  cast: [{ type: String }],
  crew: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Production', productionSchema); 