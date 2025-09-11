const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Group = require('./models/Group'); 
// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const fileRoutes = require('./routes/files');
const taskRoutes = require('./routes/tasks');
const { auth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000","null"] ,// Your React app URL
    methods: ["GET", "POST"]
  }
});

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
app.use('/api/groups', groupRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/tasks', taskRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'MERN Student-Faculty Collaboration API is working!' });
});

// Protected test route
app.get('/api/protected', auth, (req, res) => {
  res.json({ 
    message: 'This is a protected route!',
    user: req.user 
  });
});
// Add this with your other imports
const messageRoutes = require('./routes/messages');

// Add this with your other route registrations
app.use('/api/messages', messageRoutes);
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------------- Socket.IO Integration ----------------

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.name);

  // Join group rooms
  // Replace your current join-group handler with this:
socket.on('join-group', async (groupId) => {
  try {
    console.log(`User ${socket.user.name} attempting to join group: ${groupId}`);
    
    // Verify user has access to this group
    const group = await Group.findById(groupId);
    if (!group) {
      socket.emit('error', { message: 'Group not found' });
      return;
    }

    const isMember = group.members.some(member => 
      member.user.toString() === socket.userId
    );
    const isFaculty = group.faculty.some(faculty => 
      faculty.toString() === socket.userId
    );

    if (!isMember && !isFaculty) {
      socket.emit('error', { 
        message: 'No access to this group. Please join the group first.' 
      });
      return;
    }

    socket.join(groupId);
    console.log(`User ${socket.user.name} successfully joined group: ${groupId}`);
    socket.emit('joined-group', { 
      groupId, 
      message: 'Successfully joined group chat' 
    });
    
  } catch (error) {
    console.error('Group join error:', error);
    socket.emit('error', { message: 'Error joining group' });
  }
});

  // Leave group rooms
  socket.on('leave-group', (groupId) => {
    socket.leave(groupId);
    console.log(`User ${socket.user.name} left group: ${groupId}`);
  });

  // Handle new messages
  socket.on('send-message', async (data) => {
    try {
      const { content, groupId, messageType = 'text', file } = data;
      const Message = require('./models/Message');
      const message = new Message({
        content,
        sender: socket.userId,
        groupId,
        messageType,
        file
      });
      await message.save();
      await message.populate('sender', 'name email role');
      io.to(groupId).emit('new-message', message);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle message editing
  socket.on('edit-message', async (data) => {
    try {
      const { messageId, newContent } = data;
      const Message = require('./models/Message');
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      if (message.sender.toString() !== socket.userId) {
        return socket.emit('error', { message: 'Not authorized to edit this message' });
      }

      message.content = newContent;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();
      await message.populate('sender', 'name email role');
      io.to(message.groupId.toString()).emit('message-edited', message);
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('error', { message: 'Failed to edit message' });
    }
  });

  // Handle message deletion
  socket.on('delete-message', async (data) => {
    try {
      const { messageId } = data;
      const Message = require('./models/Message');
      const message = await Message.findById(messageId);

      if (!message) {
        return socket.emit('error', { message: 'Message not found' });
      }

      const isSender = message.sender.toString() === socket.userId;
      const isFacultyOrAdmin = socket.user.role === 'faculty' || socket.user.role === 'admin';

      if (!isSender && !isFacultyOrAdmin) {
        return socket.emit('error', { message: 'Not authorized to delete this message' });
      }

      await Message.findByIdAndDelete(messageId);
      io.to(message.groupId.toString()).emit('message-deleted', { messageId });
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(data.groupId).emit('user-typing', {
      userId: socket.userId,
      userName: socket.user.name,
      groupId: data.groupId
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(data.groupId).emit('user-stop-typing', {
      userId: socket.userId,
      groupId: data.groupId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.name);
  });
});

// ---------------- End of Socket.IO Integration ----------------

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
