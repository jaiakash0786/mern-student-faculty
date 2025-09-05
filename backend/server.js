const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path')
// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-collab';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'MERN Student-Faculty Collaboration API is working!' });
});
// Add this after your routes import
const { auth } = require('./middleware/auth');

// Add a protected test route
app.get('/api/protected', auth, (req, res) => {
  res.json({ 
    message: 'This is a protected route!',
    user: req.user 
  });
});
// Add this with your other imports
const groupRoutes = require('./routes/groups');

// Add this with your other route registrations
app.use('/api/groups', groupRoutes);
// Add this with your other imports
const fileRoutes = require('./routes/files');

// Add this with your other route registrations
app.use('/api/files', fileRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Define PORT
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});