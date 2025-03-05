const User = require("../models/User");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
