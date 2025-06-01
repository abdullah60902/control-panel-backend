const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ msg: 'Access denied' });

  try {
    const verified = jwt.verify(token, "do you know"); // Match secret
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Forbidden: insufficient rights' });
    }
    next();
  };
};

module.exports = { verifyToken, allowRoles };
