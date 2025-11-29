const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: 'Access denied' });

  try {
    const verified = jwt.verify(token, "do you know");

    // Token se jitna milay utna hi set karo — force na karo
    req.user = {
      _id: verified.id,
      role: verified.role,
      email: verified.email,
      hr: verified.hr || null,       // sirf staff ke liye
      clients: verified.clients || [] // sirf clients ke liye
    };

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: insufficient rights' });
    }
    next();
  };
};

module.exports = { verifyToken, allowRoles };
