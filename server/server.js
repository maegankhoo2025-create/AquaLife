// AquaLife backend entry point.
// Boilerplate generated with AI assistance (declare in README.txt).

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session')
const MongoStore = require('connect-mongo')



const tankRoutes = require('./routes/tanks');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json());    // parses JSON request bodies into req.body

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing. Add it to your server/.env file.')
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
)


// Health check: open http://localhost:8000/api/health to confirm the server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Feature routes
app.use('/api/tanks', tankRoutes);
app.use('/auth', authRoutes);

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
