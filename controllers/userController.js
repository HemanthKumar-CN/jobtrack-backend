const { User, Role } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  Schedule,
  Employee,
  Location,
  Event,
  Classification,
  EventLocationContractor,
  EventLocation,
  Contractor,
  Timesheet,
} = require("../models");
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

    // ✅ Generate JWT with role_name (no expiration - only expires on logout)
    const token = jwt.sign(
      { userId: user.id, roleName: user.Role.name }, // ✅ Store roleName instead of role_id
      process.env.JWT_SECRET,
      // No expiration set - token will only be invalidated on logout
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

exports.getScheduleByToken = async (req, res) => {
  try {
    const { response_token } = req.params;

    const schedule = await Schedule.findOne({
      where: {
        response_token,
        is_deleted: false,
      },
      include: [
        {
          model: Employee,
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name"],
            },
          ],
        },
        {
          model: Event,
          attributes: ["event_name"],
        },
        {
          model: EventLocationContractor,
          include: [
            {
              model: Contractor,
              attributes: ["first_name", "last_name", "company_name"],
            },
            {
              model: EventLocation,
              include: [
                {
                  model: Location,
                  attributes: [
                    "name",
                    "image_url",
                    "address_1",
                    "address_2",
                    "city",
                    "state",
                    "postal_code",
                  ],
                },
              ],
            },
            {
              model: Employee,
              as: "steward",
              include: [
                {
                  model: User,
                  attributes: ["first_name", "last_name"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    console.log(
      schedule.createdAt,
      schedule.updatedAt,
      schedule.createdAt.getTime(),
      "+++++++++++",
    );

    const eventName = schedule?.Event?.event_name || "";
    const startTime = schedule?.start_time || null;
    const locationName =
      schedule?.EventLocationContractor?.EventLocation?.Location?.name || "";
    const address1 =
      schedule?.EventLocationContractor?.EventLocation?.Location?.address_1 ||
      "";
    const address2 =
      schedule?.EventLocationContractor?.EventLocation?.Location?.address_2 ||
      "";
    const city =
      schedule?.EventLocationContractor?.EventLocation?.Location?.city || "";
    const state =
      schedule?.EventLocationContractor?.EventLocation?.Location?.state || "";
    const postalCode =
      schedule?.EventLocationContractor?.EventLocation?.Location?.postal_code ||
      "";
    const locationImageUrl =
      schedule?.EventLocationContractor?.EventLocation?.Location?.image_url ||
      null;
    const contractor = schedule?.EventLocationContractor?.Contractor || {};
    const contractorName = `${contractor.first_name || ""} ${
      contractor.last_name || ""
    }`.trim();
    const employeeName = `${schedule?.Employee?.User?.first_name} ${schedule?.Employee?.User?.last_name}`;
    const isNew = schedule.createdAt.getTime() === schedule.updatedAt.getTime();
    const stewardEmployee = schedule?.EventLocationContractor?.steward;
    const stewardName = stewardEmployee
      ? `${stewardEmployee.User.first_name} ${stewardEmployee.User.last_name}`
      : "";

    return res.status(200).json({
      event_name: eventName,
      start_time: startTime,
      location: locationName,
      contractor: contractorName || contractor.company_name || "",
      status: schedule.status,
      comment: schedule.comments,
      locationImageUrl,
      address1,
      address2,
      city,
      state,
      postalCode,
      employeeName,
      isNew,
      stewardName,
    });
  } catch (error) {
    console.error("Error fetching schedule by token:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.scheduleRespond = async (req, res) => {
  try {
    const { response_token, status } = req.body;

    if (!response_token || !["confirmed", "declined"].includes(status)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const schedule = await Schedule.findOne({ where: { response_token } });

    if (!schedule) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    // Update schedule status
    schedule.status = status;
    schedule.responded_at = new Date();
    await schedule.save();

    // If status is confirmed, create a timesheet record
    if (status === "confirmed") {
      // Check if timesheet already exists to avoid duplicates
      const existingTimesheet = await Timesheet.findOne({
        where: { schedule_id: schedule.id },
      });

      if (!existingTimesheet) {
        await Timesheet.create({
          schedule_id: schedule.id,
          status: "open",
          // Other fields will use their default values
          // actual_start: null (default)
          // st: 0.00 (default)
          // ot: 0.00 (default)
          // dt: 0.00 (default)
        });

        console.log(`Timesheet created for schedule ID: ${schedule.id}`);
      } else {
        console.log(`Timesheet already exists for schedule ID: ${schedule.id}`);
      }
    }

    return res.status(200).json({
      message: "Response updated",
      status: schedule.status,
      timesheet_created: status === "confirmed",
    });
  } catch (err) {
    console.error("Error updating schedule response:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
