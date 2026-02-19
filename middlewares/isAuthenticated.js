const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization)
      return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findOne({
      token: req.headers.authorization.replace('Bearer ', ''),
    });

    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    req.user = user;
    next();
  } catch {
    res.status(500).json({ message: error.message });
  }
};

module.exports = isAuthenticated;
