const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Role = require("../models/Role");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Find user by email
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, attributes: ["name"] }], // Fetch role name
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch, "=====");
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Generate JWT with role_name
    const token = jwt.sign(
      { userId: user.id, roleName: user.Role.name }, // ✅ Store roleName instead of role_id
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // ✅ Set JWT in cookies
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // ✅ Send roleName to frontend
    res
      .status(200)
      .json({ message: "Login successful", roleName: user.Role.name });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.userChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.userId); // Get user from token

    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.userLogout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  return res.json({ message: "Logged out Successfully" });
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.log("====", error);
    res.status(500).json({ error: error.errors[0].message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { first_name, last_name, email, role_id } = req.body;
    // console.log(req.body, "??>>........");

    if (Object.entries(req.body).length == 0) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the email already exists
    if (email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== parseInt(userId)) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Find and update the user
    const updatedUser = await User.update(req.body, {
      where: { id: userId, deleted_at: null },
      returning: true,
    });

    if (updatedUser[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser[1][0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error in user update" });
  }
};
