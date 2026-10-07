// AquaLife backend entry point.
// Boilerplate generated with AI assistance (declare in README.txt).

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const tankRoutes = require('./routes/tanks');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());            // lets the Vue front end (different port) call this API
app.use(express.json());    // parses JSON request bodies into req.body

// Health check: open http://localhost:8000/api/health to confirm the server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Feature routes
app.use('/api/tanks', tankRoutes);

// Fallback for unknown routes
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Connect to MongoDB, then start listening
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
