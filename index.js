require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Initialize the server
const app = express();

// For the server to read Body parameters
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import routes
const userRoutes = require('./routes/user');
const offerRoutes = require('./routes/offer');
app.use(userRoutes);
app.use(offerRoutes);

// Connect to cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome! 🐨' });
});
// Fallback for unknown routes
app.all(/.*/, (req, res) =>
  res.status(404).json({ message: 'Route does not exist' }),
);

app.listen(process.env.PORT, () => console.log('Server has started'));
