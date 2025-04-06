const Employee = require("../models/Employee");
const User = require("../models/User");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const Schedule = require("../models/Schedule");
const moment = require("moment");
const Event = require("../models/Events");

exports.createEmployee = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction

  try {
    const {
      first_name,
      last_name,
      email,
      role_id, // User role
      address_1,
      address_2,
      city,
      state,
      postal_code,
      phone,
      type,
      date_of_birth,
      hire_date,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    const image_url = req.file ? `/uploads/${req.file.filename}` : null; // Store relative path

    console.log(req.body, "=========", image_url);

    // ✅ Check if email already exists
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback(); // Rollback if user exists
      return res.status(400).json({ message: "Email already in use" });
    }

    // ✅ Generate a secure temporary password
    const tempPassword = crypto.randomBytes(6).toString("hex"); // Example: "a3f8e1b2c4d5"
    const hashedPassword = await bcrypt.hash(tempPassword, 10); // Hash password

    console.log(image_url, "-===========");
    // ✅ Create User First
    const newUser = await User.create(
      {
        first_name,
        last_name,
        email,
        password: hashedPassword, // Store hashed password
        role_id,
        image_url,
      },
      { transaction },
    );

    // ✅ Create Employee and link with the newly created User
    const newEmployee = await Employee.create(
      {
        user_id: newUser.id,
        address_1,
        address_2,
        city,
        state,
        postal_code,
        phone,
        type,
        date_of_birth,
        hire_date,
        emergency_contact_name,
        emergency_contact_phone,
      },
      { transaction },
    );

    // ✅ Commit transaction if everything is successful
    await transaction.commit();

    // TODO: Send this temp password via email to the user (implement email service)

    res.status(201).json({
      message: "Employee created successfully",
      employee: newEmployee,
      user: newUser,
      tempPassword, // Remove this in production
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    await transaction.rollback(); // ❌ Rollback on error
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query; // Default pagination values
    const offset = (page - 1) * limit;

    // Build query conditions for search
    const whereClause = search
      ? {
          [Op.or]: [
            { "$User.first_name$": { [Op.iLike]: `%${search}%` } }, // Search by first name
            { "$User.last_name$": { [Op.iLike]: `%${search}%` } }, // Search by last name
            { "$User.email$": { [Op.iLike]: `%${search}%` } }, // Search by email
          ],
        }
      : {};

    // Fetch employees with pagination
    const { count, rows: employees } = await Employee.findAndCountAll({
      include: {
        model: User,
        attributes: ["id", "first_name", "last_name", "email"],
        where: { deleted_at: null }, // Only include users who are NOT deleted
      },
      where: whereClause,
      limit: parseInt(limit),
      offset,
    });

    res.status(200).json({
      employees,
      total: count,
      hasMore: offset + employees.length < count, // Check if more data is available
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getEmployeeAbout = async (req, res) => {
  try {
    const userId = req.user.userId; // Extract userId from token

    // Fetch employee details along with user details
    const employee = await Employee.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,

          attributes: ["id", "first_name", "last_name", "email", "image_url"], // Select user fields to return
        },
      ],
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(employee);
  } catch (error) {
    console.error("Error fetching employee data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getEmployeeProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ["id", "first_name", "last_name", "image_url"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch notification_preference from employees table
    const employee = await Employee.findOne({
      where: { user_id: req.user.userId },
      attributes: ["notification_preference"],
    });

    return res.json({
      ...user.toJSON(),
      notification_preference: employee
        ? employee.getDataValue("notification_preference")
        : "email", // Default to "email"
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateMyProfilePic = async (req, res) => {
  console.log("Here inside update my profile, func");
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Construct file URL (Assuming uploads folder is served statically)
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Get user and update image URL
    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user already has a profile image, delete the old file
    // if (user.image_url) {
    //   const oldImagePath = path.join(__dirname, "../uploads", path.basename(user.image_url));
    //   if (fs.existsSync(oldImagePath)) {
    //     fs.unlinkSync(oldImagePath);
    //   }
    // }

    // Update the user's image_url
    await User.update(
      { image_url: imageUrl },
      { where: { id: req.user.userId } },
    );

    return res.json({ message: "Profile picture updated", imageUrl });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateNotificationPreference = async (req, res) => {
  try {
    const { notification_preference } = req.body;

    // Find employee record and update preference
    const employee = await Employee.findOne({
      where: { user_id: req.user.userId },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee record not found" });
    }

    // Update preference
    employee.notification_preference = notification_preference;
    await employee.save();

    return res.json({
      message: "Notification preference updated successfully",
      notification_preference,
    });
  } catch (error) {
    console.error("Error updating notification preference:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getEmployeeSchedulesWeek = async (req, res) => {
  try {
    const { startOfWeek, endOfWeek, selectedLocation } = req.body;

    console.log(req.body, ">>>>>>");

    // Convert UTC date to local date for comparison
    const startDate = moment.utc(startOfWeek).format("YYYY-MM-DD");
    const endDate = moment.utc(endOfWeek).format("YYYY-MM-DD");

    console.log(startDate, endDate, "++++++========");

    // Fetch schedules that match the given week & location via Events table
    const schedules = await Schedule.findAll({
      where: {
        [Op.or]: [
          { start_date: { [Op.between]: [startDate, endDate] } },
          { end_date: { [Op.between]: [startDate, endDate] } },
          {
            start_date: { [Op.lte]: startDate },
            end_date: { [Op.gte]: endDate },
          },
        ],
      },
      include: [
        {
          model: Event,
          where: { location_id: selectedLocation }, // Filter based on location
          attributes: [], // We only need this for filtering, so no need to fetch columns
        },
        {
          model: Employee,
          attributes: ["id"],
          include: [
            {
              model: User,
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        },
      ],
      attributes: [
        "employee_id",
        "start_date",
        "end_date",
        "start_time",
        "end_time",
      ],
      raw: true,
    });

    console.log(schedules, "::::::::::::::");

    if (!schedules.length) return res.json([]);
    // return res.json({ message: "No schedules found." });

    // Calculate working hours per employee
    let employeeHours = {};

    schedules.forEach((schedule) => {
      const empId = schedule.employee_id;
      const startDate = moment(schedule.start_date);
      const endDate = moment(schedule.end_date);
      const startTime = moment(schedule.start_time, "HH:mm:ss");
      const endTime = moment(schedule.end_time, "HH:mm:ss");

      // Calculate daily work hours
      const dailyHours = moment.duration(endTime.diff(startTime)).asHours();

      // Number of working days within selected week range
      let totalDays = 0;
      let currentDate = startDate.clone();

      while (currentDate.isSameOrBefore(endDate)) {
        if (currentDate.isBetween(startDate, endDate, null, "[]")) {
          totalDays++;
        }
        currentDate.add(1, "days");
      }

      // Total hours worked for this schedule
      const totalHours = totalDays * dailyHours;

      if (employeeHours[empId]) {
        employeeHours[empId] += totalHours;
      } else {
        employeeHours[empId] = totalHours;
      }
    });

    // Fetch employee details
    const employees = await Employee.findAll({
      where: { id: Object.keys(employeeHours) },
      include: [{ model: User, attributes: ["first_name", "last_name"] }],
    });

    // Format response
    const result = employees.map((emp) => ({
      employee_id: emp.id,
      user_id: emp.user_id,
      first_name: emp.User.first_name,
      last_name: emp.User.last_name,
      total_hours: employeeHours[emp.id] || 0,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching employee hours:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch employee with user details, ensuring user is not soft deleted
    const employee = await Employee.findOne({
      where: { id },
      include: {
        model: User,
        attributes: ["id", "first_name", "last_name", "email", "image_url"],
        where: { deleted_at: null }, // Exclude soft-deleted users
      },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found or deleted" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updatePersonalInfo = async (req, res) => {
  const employeeId = req.params.id;
  const { firstName, lastName, email, address1, address2, city, state, zip } =
    req.body;

  try {
    // Start transaction to ensure atomicity
    const transaction = await sequelize.transaction();

    // Find employee
    const employee = await Employee.findByPk(employeeId, { transaction });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Find associated user
    const user = await User.findByPk(employee.user_id, { transaction });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Update Employee Table
    await Employee.update(
      {
        address_1: address1,
        address_2: address2,
        city,
        state,
        postal_code: zip,
      },
      { where: { id: employeeId }, transaction },
    );

    // ✅ Update User Table
    await User.update(
      {
        first_name: firstName,
        last_name: lastName,
        email,
      },
      { where: { id: user.id }, transaction },
    );

    // Commit transaction
    await transaction.commit();

    return res.json({
      message: "Employee and User details updated successfully",
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateEmployee = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction

  try {
    const { id } = req.params;
    const updatedData = req.body;
    const {
      first_name,
      last_name,
      email,
      role_id,
      address_1,
      address_2,
      city,
      state,
      postal_code,
      phone,
      type,
      date_of_birth,
      hire_date,
      emergency_contact_name,
      emergency_contact_phone,
    } = updatedData;

    // ✅ Find the employee by ID
    const employee = await Employee.findByPk(id, { transaction });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Employee not found" });
    }

    // ✅ Find the associated user
    const user = await User.findByPk(employee.user_id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ message: "User not found for this employee" });
    }

    // ✅ Check if the email is being changed and already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { email },
        transaction,
      });
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // ✅ Handle image upload (if a new file is uploaded)
    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : user.image_url;

    // ✅ Update User table
    await user.update(
      {
        first_name,
        last_name,
        email,
        role_id,
        image_url,
      },
      { transaction },
    );

    // ✅ Update Employee table
    await employee.update(
      {
        address_1,
        address_2,
        city,
        state,
        postal_code,
        phone,
        type,
        date_of_birth,
        hire_date,
        emergency_contact_name,
        emergency_contact_phone,
      },
      { transaction },
    );

    // ✅ Commit transaction
    await transaction.commit();

    // ✅ Format response to include user inside employee
    const updatedEmployee = {
      ...employee.toJSON(),
      User: user.toJSON(), // Embed user inside employee object
    };

    res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    await transaction.rollback(); // ❌ Rollback on error
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Soft Delete (Just updates deleted_at to new date)
exports.softDeleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    const user = await User.findByPk(employee.user_id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ deleted_at: new Date() });
    res.status(200).json({ message: "Employee soft deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getEmployeesList = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "image_url", "first_name", "last_name"], // Get user data (image_url)
        },
      ],
      order: [["createdAt", "DESC"]], // Optional: Order by latest created
      attributes: ["id", "user_id", "type"], // Only get specific columns
    });

    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
