const jwt = require("jsonwebtoken");

exports.authenticateUser = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token)
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });

    // ✅ Verify JWT and get role_name
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, roleName }

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
