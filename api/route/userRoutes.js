const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../model/usermodel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, allowRoles } = require('../middleware/auth');
const Client = require('../model/client'); // 👈 Add this line
const CarePlanning = require('../model/CarePlanning');
const Hr = require('../model/Hr'); // ✅ Hr model import
const JWT_SECRET = "do you know"; // In production use env variables
const sendMail = require("../utils/mailer");


// Signup route with special first user logic
// Signup route with special first user logic
router.post('/signup', async (req, res) => {
  const { fullName, email, role, password, confirmPassword, clients, hr, allowedPages } = req.body;

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

    if (clients && role === 'Client') {
      const validClients = await Client.find({ _id: { $in: clients } });
      if (validClients.length !== clients.length) {
        return res.status(400).json({ msg: 'One or more client IDs are invalid' });
      }
    }

    if (role === "Staff") {
      if (!hr) {
        return res.status(400).json({ msg: "Staff must be attached to an HR" });
      }

      const validHr = await Hr.findById(hr);
      if (!validHr) {
        return res.status(400).json({ msg: "Invalid HR ID" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      fullName,
      email,
      role,
      password: hashedPassword,
      clients: role === 'Client' ? clients : [],
      hr: role === 'Staff' ? hr : null,
allowedPages: role === 'External'
  ? ["Dashboard", ...(allowedPages?.filter(p => p !== "Dashboard") || [])]
  : [],
      mustChangePassword: true,
    });

    // ✅ send mail logic unchanged
  await sendMail(
  newUser.email,
  "Welcome to Care Home Management",
  `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; padding: 30px; text-align: center;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="background-color: #2563eb; color: white; padding: 20px;">
        <h2 style="margin: 0;">Welcome to Care Home Management</h2>
      </div>

      <div style="padding: 30px; text-align: left;">
        <h3>Hello ${newUser.fullName}, 👋</h3>
        <p>Your account has been created successfully! We're thrilled to have you as part of the Care Home Management family.</p>

        <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
          <p><strong>Email:</strong> ${newUser.email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>

        <p>For your security, please change your password after logging in for the first time.</p>

        <a href="https://control-panel-frontend-sc75.vercel.app/Login" 
           style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; 
           padding: 10px 20px; border-radius: 6px; font-weight: 500; margin-top: 10px;">
           Login to Your Account
        </a>

        <p style="margin-top: 20px; color: #555;">If you didn’t request this account, please contact our support team immediately.</p>
      </div>

      <div style="background-color: #f1f5f9; color: #666; font-size: 12px; padding: 15px;">
        © ${new Date().getFullYear()} Care Home Management. All rights reserved.
      </div>
    </div>
  </div>
  `
);


    await newUser.save();

    res.status(201).json({
      msg: 'User registered successfully',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        clients: newUser.clients,
        hr: newUser.hr,
        allowedPages: newUser.allowedPages, // ✅ include this
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});


// Login route (open to all)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
const user = await User.findOne({ email }).populate('clients')
  .populate("hr"); // ✅ add this
;
    if (!user) return res.status(401).json({ msg: 'Email is not correct' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Psssword is wrong' });

    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
            clients: user.clients.map(client => client._id.toString()), // 👈 Add this
                hr: user.hr // ✅ staff ko apna HR milega


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
  clients: user.clients.map(client => client._id.toString()),
    hr: user.hr,
    allowedPages: user.allowedPages, // ✅ ADD THIS
    mustChangePassword: user.mustChangePassword,
  },
});


  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Get all users (Admin only)
router.get('/', verifyToken, allowRoles('Admin', 'External'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get user by ID (Admin only)
router.get(
  '/:id',
  verifyToken,
  allowRoles('Admin', 'External'),
  async (req, res) => {
    try {
      // Optional restriction for External users
      if (req.user.role === 'External' && req.user._id !== req.params.id) {
        return res.status(403).json({ msg: 'Forbidden: cannot access other users' });
      }

      const user = await User.findById(req.params.id).select('-password');
      if (!user) return res.status(404).json({ msg: 'User not found' });
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


// Update user by ID (Admin only)

router.put('/:id', verifyToken, allowRoles('Admin'), async (req, res) => {
  const { fullName, email, role, password, clients, hr, allowedPages } = req.body;

  if (!fullName || !email || !role) {
    return res.status(400).json({ msg: 'Full name, email, and role are required' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // ✅ Basic info update
    user.fullName = fullName;
    user.email = email;
    user.role = role;

    // ✅ Hash password if provided
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }
  user.mustChangePassword = true;

    // ✅ Handle Client Role
    if (role === 'Client') {
      if (!clients || !Array.isArray(clients)) {
        return res.status(400).json({ msg: 'Clients must be an array for Client role' });
      }

      const validClients = await Client.find({ _id: { $in: clients } });
      if (validClients.length !== clients.length) {
        return res.status(400).json({ msg: 'One or more client IDs are invalid' });
      }

      user.clients = clients;
    } else {
      user.clients = []; // clear clients if not Client
    }

    // ✅ Handle Staff Role
    if (role === 'Staff') {
      if (!hr) {
        return res.status(400).json({ msg: 'Staff must be attached to an HR' });
      }

      const validHr = await Hr.findById(hr);
      if (!validHr) {
        return res.status(400).json({ msg: 'Invalid HR ID' });
      }

      user.hr = hr;
    } else {
      user.hr = null; // clear HR if not staff
    }

    // ✅ Handle External Role (allowedPages logic)
   if (role === 'External') {
  user.allowedPages = Array.isArray(allowedPages)
    ? ["Dashboard", ...allowedPages.filter(p => p !== "Dashboard")]
    : ["Dashboard"];
} else {
  user.allowedPages = [];
}
await sendMail(
  user.email,
  "Welcome to Care Home Management",
  `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; padding: 30px; text-align: center;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="background-color: #2563eb; color: white; padding: 20px;">
        <h2 style="margin: 0;">Welcome to Care Home Management</h2>
      </div>

      <div style="padding: 30px; text-align: left;">
        <h3>Hello ${user.fullName}, 👋</h3>
        <p>Your account has been created successfully! We're thrilled to have you as part of the Care Home Management family.</p>

        <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>

        <p>For your security, please change your password after logging in for the first time.</p>

        <a href="http://localhost:3000/login" 
           style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; 
           padding: 10px 20px; border-radius: 6px; font-weight: 500; margin-top: 10px;">
           Login to Your Account
        </a>

        <p style="margin-top: 20px; color: #555;">If you didn’t request this account, please contact our support team immediately.</p>
      </div>

      <div style="background-color: #f1f5f9; color: #666; font-size: 12px; padding: 15px;">
        © ${new Date().getFullYear()} Care Home Management. All rights reserved.
      </div>
    </div>
  </div>
  `
);



    await user.save();

    res.status(200).json({
      msg: 'User updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        clients: user.clients,
        hr: user.hr,
        allowedPages: user.allowedPages,
      },
    });
  } catch (err) {
    console.error("Update error:", err);
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


// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // role ko preserve karna (no change in role)
    const role = user.role;

    // Generate random password
    const newPasswordPlain = Math.random().toString(36).slice(-8); // 8 char random password
    const hashedPassword = await bcrypt.hash(newPasswordPlain, 10);

    // Update user password
    user.password = hashedPassword;
    user.mustChangePassword = true; // 👈 Force password change on next login

    await user.save();

    // Send mail
    await sendMail(
  user.email,
  "Password Reset - Care Home Management",
  `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; padding: 30px; text-align: center;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      
      <div style="background-color: #2563eb; color: white; padding: 20px;">
        <h2 style="margin: 0;">Password Reset Successful</h2>
      </div>

      <div style="padding: 30px; text-align: left;">
        <h3>Hello ${user.fullName}, 👋</h3>
        <p>Your password has been successfully reset for your Care Home Management account.</p>

        <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
          <p><strong>Role:</strong> ${role}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>New Password:</strong> ${newPasswordPlain}</p>
        </div>

        <p>For your security, please change this password after logging in.</p>

        <a href="http://localhost:3000/login" 
           style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; 
           padding: 10px 20px; border-radius: 6px; font-weight: 500; margin-top: 10px;">
           Login to Your Account
        </a>

        <p style="margin-top: 20px; color: #555;">If you did not request a password reset, please contact our support team immediately.</p>
      </div>

      <div style="background-color: #f1f5f9; color: #666; font-size: 12px; padding: 15px;">
        © ${new Date().getFullYear()} Care Home Management. All rights reserved.
      </div>
    </div>
  </div>
  `
);


    res.status(200).json({ msg: 'New password sent to your email' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/change-password', verifyToken, async (req, res) => {
    console.log("Decoded user from token:", req.user); // 👈 add this line

  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Old password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false; // 👈 Flag reset
    await user.save();

    res.status(200).json({ msg: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
