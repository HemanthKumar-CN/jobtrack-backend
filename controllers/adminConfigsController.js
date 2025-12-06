const { AdminConfig } = require("../models");

const getAdminConfigs = async (req, res) => {
  console.log("Fetching AdminConfig for user:", req.user);
  try {
    const config = await AdminConfig.findOne({
      where: { user_id: req.user.userId },
    });

    if (!config) {
      return res
        .status(404)
        .json({ success: false, error: "Config doesn't exist" });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error fetching AdminConfig:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const createOrUpdateAdminConfig = async (req, res) => {
  try {
    const { type, message } = req.body;

    let config = await AdminConfig.findOne({
      where: { user_id: req.user.userId },
    });

    if (!config) {
      // create blank config first
      config = await AdminConfig.create({
        user_id: req.user.userId,
        new_schedule_message: null,
        update_schedule_message: null,
      });
    }

    const defaultNewMessage =
      "You are scheduled for [Event] at [Location] from [Start Date], [Start Time]";
    const defaultUpdateMessage =
      "Your schedule for [Event] at [Location] is updated from [Start Date], [Start Time]";

    if (type === "new_schedule") {
      config.new_schedule_message = message?.trim()
        ? message
        : defaultNewMessage;
    } else if (type === "update_schedule") {
      config.update_schedule_message = message?.trim()
        ? message
        : defaultUpdateMessage;
    } else {
      return res.status(400).json({ success: false, error: "Invalid type" });
    }

    await config.save();

    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error updating AdminConfig:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const updatePhoneNumber = async (req, res) => {
  try {
    const { phone_number } = req.body;

    // Validate phone number
    if (!phone_number) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required.",
      });
    }

    // Find or create admin config entry for the given user_id
    let config = await AdminConfig.findOne({
      where: { user_id: req.user.userId },
    });

    if (!config) {
      // Create new config if it doesn't exist
      config = await AdminConfig.create({
        user_id: req.user.userId,
        phone_number: phone_number,
      });
    } else {
      // Update the phone number
      config.phone_number = phone_number;
      await config.save();
    }

    console.log(
      "Updated phone number for user:",
      req.user.userId,
      "to",
      phone_number,
    );

    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error updating phone number in AdminConfig:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = {
  getAdminConfigs,
  createOrUpdateAdminConfig,
  updatePhoneNumber,
};
