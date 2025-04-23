const express = require('express');
const router = express.Router();

// Basic auth routes
router.post('/register', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/logout', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

module.exports = router; 