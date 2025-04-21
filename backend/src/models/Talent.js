const mongoose = require('mongoose');

const talentSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  contactInfo: { type: String, required: true },
  availability: { type: String, required: true },
  notes: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Talent', talentSchema); 