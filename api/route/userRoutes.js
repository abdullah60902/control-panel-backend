const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../model/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, allowRoles } = require('../middleware/auth');
const Client = require('../model/client'); // 👈 Add this line
const CarePlanning = require('../model/CarePlanning');

const JWT_SECRET = "do you know"; // In production use env variables

// Signup route with special first user logic
// Signup route with special first user logic
router.post('/signup', async (req, res) => {
  const { fullName, email, role, password, confirmPassword, clients } = req.body;

  if (!fullName || !email || !role || !password || !confirmPassword) {
    return res.status(400).json({ msg: 'All fields are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'Passwords do not match' });
  }

  try {
    const adminCount = await User.countDocuments({ role: 'Admin' });

    if (adminCount === 0) {
      if (role !== 'Admin') {
        return res.status(400).json({ msg: 'First user must be an Admin' });
      }
    } else {
      if (!req.headers.authorization) {
        return res.status(401).json({ msg: 'Authorization token required' });
      }
      const token = req.headers.authorization.split(' ')[1];
      if (!token) return res.status(401).json({ msg: 'Authorization token malformed' });

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ msg: 'Invalid token' });
      }

      if (decoded.role !== 'Admin') {
        return res.status(403).json({ msg: 'Only Admins can create users' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    // ✅ Only validate clients exist in DB (not care plan)
    if (clients && role === 'Client') {
      const validClients = await Client.find({ _id: { $in: clients } });
      if (validClients.length !== clients.length) {
        return res.status(400).json({ msg: 'One or more client IDs are invalid' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      fullName,
      email,
      role,
      password: hashedPassword,
      clients: role === 'Client' ? clients : [], // ✅ Attach directly
    });

    await newUser.save();

    res.status(201).json({
      msg: 'User registered successfully',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        clients: newUser.clients
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});


// Login route (open to all)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
const user = await User.findOne({ email }).populate('clients');
    if (!user) return res.status(401).json({ msg: 'Email is not correct' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Psssword is wrong' });

    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
            clients: user.clients.map(client => client._id.toString()) // 👈 Add this

      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      msg: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
                clients: user.clients, // ✅ send attached clients too

      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get all users (Admin only)
router.get('/', verifyToken, allowRoles('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID (Admin only)
router.get('/:id', verifyToken, allowRoles('Admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user by ID (Admin only)
router.put('/:id', verifyToken, allowRoles('Admin'), async (req, res) => {
  const { fullName, email, role, password, clients } = req.body;

  if (!fullName || !email || !role) {
    return res.status(400).json({ msg: 'Full name, email, and role are required' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.fullName = fullName;
    user.email = email;
    user.role = role;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    // ✅ Only update clients if user role is Client
    if (role === 'Client') {
      if (!clients || !Array.isArray(clients)) {
        return res.status(400).json({ msg: 'Clients must be an array for Client role' });
      }

      // Optional: Validate attached clients exist
      const validClients = await Client.find({ _id: { $in: clients } });
      if (validClients.length !== clients.length) {
        return res.status(400).json({ msg: 'One or more client IDs are invalid' });
      }

      user.clients = clients;
    } else {
      user.clients = []; // Remove clients if not a Client role
    }

    await user.save();

    res.status(200).json({
      msg: 'User updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        clients: user.clients
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete user by ID (Admin only)
router.delete('/:id', verifyToken, allowRoles('Admin'), async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ msg: 'User not found' });
    res.status(200).json({ msg: 'User deleted', user: deletedUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
