const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Initialize the server
const app = express();

// Make sure the server can read Body parameters
app.use(express.json());

//Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/vinted-app');

// Import routes
const userRoutes = require('./routes/user');
const offerRoutes = require('./routes/offer');
app.use(userRoutes);
app.use(offerRoutes);

// Connect to cloudinary
cloudinary.config({
  cloud_name: 'dghjtavmr',
  api_key: '982935578138151',
  api_secret: 'Ax2w4aGIuf9mxsDxlP2xE7zOGjQ',
});

// Fallback for unknown routes
app.all(/.*/, (req, res) =>
  res.status(404).json({ message: 'Route does not exist' }),
);

app.listen(3000, () => console.log('Server has started'));
