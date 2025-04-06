const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  productionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Production', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  steps: [{ type: String }],
  assignedTo: { type: String },
  dueDate: { type: Date },
  notes: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Workflow', workflowSchema); 