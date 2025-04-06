const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema); 