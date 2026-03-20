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

const updateOrganization = async (req, res) => {
  try {
    const { organization } = req.body;

    let config = await AdminConfig.findOne({
      where: { user_id: req.user.userId },
    });

    if (!config) {
      config = await AdminConfig.create({
        user_id: req.user.userId,
        organization: organization || null,
      });
    } else {
      config.organization = organization || null;
      await config.save();
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error updating organization in AdminConfig:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const getLabels = async (req, res) => {
  try {
    const config = await AdminConfig.findOne({
      where: { user_id: req.user.userId },
    });

    // Return empty object if no config exists (frontend will use defaults)
    if (!config) {
      return res.json({ success: true, data: {} });
    }

    // Extract only label fields
    const labels = {
      label_schedules: config.label_schedules,
      label_timesheets: config.label_timesheets,
      label_employees: config.label_employees,
      label_events: config.label_events,
      label_locations: config.label_locations,
      label_contractors: config.label_contractors,
      label_restrictions: config.label_restrictions,
      label_classifications: config.label_classifications,
      label_reports: config.label_reports,
      label_dashboard: config.label_dashboard,
      label_sms_info: config.label_sms_info,
      label_section_scheduling: config.label_section_scheduling,
      label_section_analytics: config.label_section_analytics,
      label_section_admin: config.label_section_admin,
    };

    res.json({ success: true, data: labels });
  } catch (error) {
    console.error("Error fetching labels:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

const updateLabels = async (req, res) => {
  try {
    const labels = req.body;

    // Find or create admin config
    let config = await AdminConfig.findOne({
      where: { user_id: req.user.userId },
    });

    if (!config) {
      config = await AdminConfig.create({
        user_id: req.user.userId,
        ...labels,
      });
    } else {
      // Update only the label fields provided
      const labelFields = [
        "label_schedules",
        "label_timesheets",
        "label_employees",
        "label_events",
        "label_locations",
        "label_contractors",
        "label_restrictions",
        "label_classifications",
        "label_reports",
        "label_dashboard",
        "label_sms_info",
        "label_section_scheduling",
        "label_section_analytics",
        "label_section_admin",
      ];

      labelFields.forEach((field) => {
        if (labels.hasOwnProperty(field)) {
          // Allow setting to null/empty to reset to default
          config[field] = labels[field] || null;
        }
      });

      await config.save();
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error updating labels:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

module.exports = {
  getAdminConfigs,
  createOrUpdateAdminConfig,
  updatePhoneNumber,
  updateOrganization,
  getLabels,
  updateLabels,
};
