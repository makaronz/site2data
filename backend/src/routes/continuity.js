const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

module.exports = router; 