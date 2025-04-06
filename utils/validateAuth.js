const jwt = require("jsonwebtoken");

exports.validAuth = async (req, res) => {
  const token = req.cookies.token; // ✅ Get token from cookies

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded, "???????");
    res.json({ auth: true, roleName: decoded.roleName });
  } catch (err) {
    res.clearCookie("token"); // ✅ Remove expired token
    return res.status(401).json({ message: "Session expired" });
  }
};
