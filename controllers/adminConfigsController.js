const { AdminConfig } = require("../models");

const getAdminConfigs = async (req, res) => {
  try {
    const config = await AdminConfig.findOne({
      where: { user_id: req.user.userId },
    });

    if (!config) {
      return res.status(404).json({ success: false, error: "Not found" });
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
        user_id,
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

module.exports = {
  getAdminConfigs,
  createOrUpdateAdminConfig,
};
