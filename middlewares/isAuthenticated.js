const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  if (!req.headers.authorization)
    return res.status(401).json({ message: 'Unauthorized' });

  const user = await User.findOne({
    token: req.headers.authorization.replace('Bearer ', ''),
  });

  // .select('email account');

  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  req.user = user;
  next();
};

module.exports = isAuthenticated;
