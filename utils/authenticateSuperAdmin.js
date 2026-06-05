const jwt = require("jsonwebtoken");

exports.authenticateSuperAdmin = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token)
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.roleName !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Forbidden. Super admin only." });
    }

    req.user = {
      userId: decoded.userId,
      roleName: decoded.roleName,
      organizationId: decoded.organizationId ?? null,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
