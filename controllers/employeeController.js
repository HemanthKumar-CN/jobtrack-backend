const {
  Employee,
  User,
  Schedule,
  Event,
  Restriction,
  TimeOff,
  TimeOffReason,
  RecurringBlockedTime,
  EmployeeRestriction,
  AdminConfig,
} = require("../models");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");
const { Op, Sequelize } = require("sequelize");
const moment = require("moment");
const sendWelcomeEmail = require("../utils/mailer");

exports.createEmployee = async (req, res) => {
  const transaction = await Employee.sequelize.transaction();

  try {
    const {
      firstName,
      lastName,
      address1,
      address2,
      city,
      state,
      zip,
      employer,
      homePhone,
      mobilePhone,
      SSN,
      comments,
      SN,
      numberId,
      email,
      birthdate,
      status,
      FDC,
      GES,
      DrvLic,
      four,
      type,
      inactive_reason,
    } = req.body;

    // Parse FormData stringified JSON fields
    let selectedRestrictions = [];
    let recurringTimes = [];
    let timeOffs = [];

    try {
      if (req.body.selectedRestrictions) {
        selectedRestrictions = JSON.parse(req.body.selectedRestrictions);
      }
      if (req.body.recurringTimes) {
        recurringTimes = JSON.parse(req.body.recurringTimes);
      }
      if (req.body.timeOffs) {
        timeOffs = JSON.parse(req.body.timeOffs);
      }
    } catch (parseErr) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Invalid JSON fields in request" });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ message: "Email already in use" });
    }

    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newUser = await User.create(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        role_id: 3, // Fixed role for employee
        image_url,
      },
      { transaction },
    );

    // console.log(newUser, "=== New User created..bro");

    const newEmployee = await Employee.create(
      {
        user_id: newUser.id,
        address_1: address1,
        address_2: address2,
        city,
        state,
        postal_code: zip,
        employer,
        phone: homePhone,
        date_of_birth: birthdate,
        mobile_phone: mobilePhone,
        ssn: SSN,
        snf: SN,
        number_id: numberId,
        comments: comments,
        type: type || "A-List",
        status: status || "active",
        inactive_reason,
        fdc: FDC,
        ges: GES,
        drv_lic: DrvLic,
        four: four,
      },
      { transaction },
    );

    // console.log(newEmployee, "New employee created**************");

    // Store employee_restrictions
    if (
      Array.isArray(selectedRestrictions) &&
      selectedRestrictions.length > 0
    ) {
      // const restrictionIds = selectedRestrictions.map((r) => r.id);
      // await newEmployee.setRestrictions(restrictionIds, { transaction });

      // ✅ Modify this block
      // Map restrictions to include activeDate and inactiveDate for the junction table
      const restrictionAssociations = selectedRestrictions.map((r) => ({
        restriction_id: r.id,
        // Convert Date objects to ISO string or null for DATEONLY type
        active_date: r.active_date
          ? new Date(r.active_date).toISOString().split("T")[0]
          : null,
        inactive_date: r.inactive_date
          ? new Date(r.inactive_date).toISOString().split("T")[0]
          : null,
      }));

      console.log(restrictionAssociations, "+++===+++ restrictionAssociations");

      // Use `addRestrictions` with `through` option for the additional fields
      // `setRestrictions` replaces all existing associations.
      // `addRestrictions` adds new ones without removing old, but you need to manage existing.
      // For creating, `setRestrictions` is often used to ensure fresh state.
      await newEmployee.setRestrictions(
        [], // Clear existing
        { transaction },
      );
      for (const association of restrictionAssociations) {
        console.log(
          `Attempting to add restriction ${association.restriction_id} with active_date: ${association.active_date}, inactive_date: ${association.inactive_date}`,
        );
        await newEmployee.addRestriction(association.restriction_id, {
          through: {
            active_date: association.active_date,
            inactive_date: association.inactive_date,
          },
          transaction,
        });
      }
    }

    console.log("Stored employee restrictions...(((********");

    // Store recurring blocked times
    for (const block of recurringTimes) {
      const { days, startDate, endDate, startTime, endTime } = block;

      // Basic validation for the block itself
      if (!Array.isArray(days) || days.length === 0) {
        console.warn(
          "Skipping recurring time block due to missing or invalid days:",
          block,
        );
        continue; // Skip to the next block
      }

      for (const day of days) {
        await RecurringBlockedTime.create(
          {
            employee_id: newEmployee.id,
            day_of_week: day,
            start_date: startDate,
            end_date: endDate,
            start_time: startTime.match(/^\d{2}:\d{2}$/)
              ? `${startTime}:00`
              : startTime,
            end_time: endTime.match(/^\d{2}:\d{2}$/)
              ? `${endTime}:00`
              : endTime,
          },
          { transaction },
        );
      }
    }

    for (const timeOff of timeOffs) {
      // Add validation here
      if (!timeOff.reason_id || isNaN(parseInt(timeOff.reason_id))) {
        // Optionally, skip this timeOff or return an error
        console.warn("Skipping timeOff due to invalid reason_id:", timeOff);
        continue; // Skip to the next timeOff
        // Or, you could throw an error:
        // throw new Error("Invalid reason_id provided for time off.");
      }

      // Ensure date and time fields are not empty or invalid
      // If startDate, endDate, startTime, endTime can be optional,
      // you'll need to handle potential 'Invalid date' or empty strings
      // For now, let's just make sure reason_id is valid.

      await TimeOff.create(
        {
          employee_id: newEmployee.id,
          reason_id: parseInt(timeOff.reason_id), // Ensure it's an integer
          start_date: timeOff.startDate || null, // Allow null if optional
          end_date: timeOff.endDate || null, // Allow null if optional
          start_time: timeOff.startTime
            ? timeOff.startTime.match(/^\d{2}:\d{2}$/)
              ? `${timeOff.startTime}:00`
              : timeOff.startTime
            : null,
          end_time: timeOff.endTime
            ? timeOff.endTime.match(/^\d{2}:\d{2}$/)
              ? `${timeOff.endTime}:00`
              : timeOff.endTime
            : null,
        },
        { transaction },
      );
    }

    await transaction.commit();
    try {
      await sendWelcomeEmail(email, firstName, tempPassword);
    } catch (error) {
      console.log(error, "Error while sending mail");
    }

    res.status(201).json({
      message: "Employee created successfully",
      employee: newEmployee,
      user: newUser,
      tempPassword, // ⛔️ Remove this in production
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    console.error(
      "Full Employee Creation Error:",
      JSON.stringify(error, null, 2),
    );

    await transaction.rollback();
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

exports.getClassificationList = async (req, res) => {};

exports.getAllRestrictions = async (req, res) => {
  try {
    const restrictions = await Restriction.findAll({
      order: [["description", "ASC"]],
    });

    console.log(restrictions, "????????????????//////////");
    res.status(200).json(restrictions);
  } catch (error) {
    console.error("Error fetching restrictions:", error);
    res.status(500).json({ message: "Failed to fetch restrictions" });
  }
};

exports.getNotScheduledEmployees = async (req, res) => {
  const {
    date,
    search = "",
    sortField = "snf",
    sortOrder = "asc",
    type,
    capacity,
    restriction,
  } = req.query;

  if (!moment(date, "YYYY-MM-DD", true).isValid()) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid date format" });
  }

  let order = [];
  if (sortField === "snf") {
    order.push([
      Sequelize.cast(Sequelize.col("snf"), "INTEGER"),
      sortOrder.toUpperCase(),
    ]);
  } else if (sortField && sortOrder) {
    order.push([sortField, sortOrder.toUpperCase()]);
  }

  try {
    // 🔸 Step 1: Get employee IDs already scheduled on this date
    const startOfDay = moment.utc(date).startOf("day").toDate();
    const endOfDay = moment.utc(date).endOf("day").toDate();

    const scheduled = await Schedule.findAll({
      where: {
        is_deleted: false,
        start_time: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      attributes: ["employee_id"],
      group: ["employee_id"],
    });

    const scheduledEmployeeIds = scheduled.map((s) => s.employee_id);

    console.log(
      "Scheduled raw: @not-scheduled",
      scheduled.map((s) => s.toJSON()),
    );
    console.log("Scheduled IDs: @not-scheduled", scheduledEmployeeIds);

    // 🔸 Step 2: Fetch all employees
    const employees = await Employee.findAll({
      where: {
        id: {
          [Op.notIn]: scheduledEmployeeIds, // ⛔️ Filter out already scheduled
        },
        status: "active", // Only active employees
        ...(type && { type }),
      },
      order,
      attributes: [
        "id",
        "user_id",
        "phone",
        "type",
        "snf",
        "mobile_phone",
        "comments",
      ],
      include: [
        {
          model: User,
          attributes: ["first_name", "last_name", "image_url", "email"],
          required: true,
          where: {
            deleted_at: null,
            ...(search && {
              [Op.or]: [
                { first_name: { [Op.iLike]: `%${search}%` } },
                { last_name: { [Op.iLike]: `%${search}%` } },
              ],
            }),
          },
        },
        {
          model: Restriction,
          as: "restrictions",
          attributes: ["id", "description"],
          through: { attributes: ["active_date", "inactive_date"] },
        },
        {
          model: RecurringBlockedTime,
          as: "recurringBlockedTimes",
          attributes: [
            "start_date",
            "end_date",
            "day_of_week",
            "start_time",
            "end_time",
          ],
        },
        {
          model: TimeOff,
          as: "timeOffs",
          attributes: ["start_date", "end_date", "reason_id"],
          include: {
            model: TimeOffReason, // Include TimeOffReason model
            as: "reason",
            attributes: ["name"], // Get the reason description
          },
        },
      ],
    });

    const inputDate = moment(date, "YYYY-MM-DD");
    const dayLetterMap = {
      0: "Su",
      1: "M",
      2: "T",
      3: "W",
      4: "Th",
      5: "F",
      6: "Sa",
    };
    const dayLetter = dayLetterMap[inputDate.day()];

    let restrictionIds = [];
    if (restriction) {
      try {
        // handle `[6,4]` (from querystring) → [6,4]
        restrictionIds = Array.isArray(restriction)
          ? restriction.map((id) => parseInt(id))
          : JSON.parse(restriction); // in case it's a JSON string "[6,4]"
      } catch {
        restrictionIds = [parseInt(restriction)];
      }
    }

    const result = employees
      .map((emp) => {
        let capacity = "Available";
        let subtext = "";

        const isUnavailable = emp.timeOffs.find((t) => {
          return (
            moment(t.start_date).isSameOrBefore(inputDate, "day") &&
            moment(t.end_date).isSameOrAfter(inputDate, "day")
          );
        });
        if (isUnavailable) {
          console.log(isUnavailable, "++++++++++isUnavailable");
          capacity = "Unavailable";
          subtext = `${isUnavailable.reason.name} `;
        } else {
          const isLimited = emp.recurringBlockedTimes.find((b) => {
            return (
              b.day_of_week === dayLetter &&
              moment(b.start_date).isSameOrBefore(inputDate, "day") &&
              moment(b.end_date).isSameOrAfter(inputDate, "day")
            );
          });

          if (isLimited) {
            console.log(isLimited, "++++++++++isLimited");

            capacity = "Limited";
            const startTime = moment(isLimited.start_time, "HH:mm:ss").format(
              "h:mma",
            );
            const endTime = moment(isLimited.end_time, "HH:mm:ss").format(
              "h:mma",
            );
            subtext = `${startTime} - ${endTime}`;
          }
        }

        return {
          id: emp.id,
          user_id: emp.user_id,
          phone: emp.phone,
          mobile_phone: emp.mobile_phone,
          User: emp.User,
          restrictions: emp.restrictions,
          comments: emp.comments,
          capacity,
          subtext,
          type: emp.type,
          snf: emp.snf,
        };
      })
      .filter((emp) => {
        // ✅ Filter by capacity (if passed)
        if (capacity && emp.capacity !== capacity) return false;

        // if (restriction) {
        //   const hasRestriction = emp.restrictions.some(
        //     (r) => r.id === parseInt(restriction),
        //   );
        //   if (!hasRestriction) return false;
        // }
        if (restrictionIds.length > 0) {
          const empRestrictionIds = emp.restrictions.map((r) => r.id);
          const hasMatch = empRestrictionIds.some((id) =>
            restrictionIds.includes(id),
          );
          if (!hasMatch) return false;
        }
        return true;
      });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching employees with capacity:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 100,
      status,
      sortField,
      sortOrder,
      typeFilter,
      firstNameFilter,
      lastNameFilter,
    } = req.query; // Default pagination values
    const offset = (page - 1) * limit;

    // 🔍 Building WHERE clause
    const whereClause = {
      ...(status && { status }),
      ...(typeFilter && { type: typeFilter }),
    };

    // 🔍 Building User filter clause
    const userWhereClause = {
      deleted_at: null,
      ...(search && {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ],
      }),
      ...(firstNameFilter && {
        first_name: { [Op.iLike]: `%${firstNameFilter}%` },
      }),
      ...(lastNameFilter && {
        last_name: { [Op.iLike]: `%${lastNameFilter}%` },
      }),
    };

    // 🔃 Sorting
    const order = [];
    if (sortField && sortOrder) {
      if (["first_name", "last_name", "email"].includes(sortField)) {
        order.push([
          { model: User, as: "User" },
          sortField,
          sortOrder.toUpperCase(),
        ]);
      } else if (sortField === "snf") {
        // order.push([
        //   Sequelize.cast(Sequelize.col("snf"), "INTEGER"),
        //   sortOrder.toUpperCase(),
        // ]);

        order.push([
          Sequelize.literal(
            `COALESCE(NULLIF("Employee"."snf", '')::INTEGER, 999999)`,
          ),
          sortOrder.toUpperCase(),
        ]);
      } else {
        order.push([sortField, sortOrder.toUpperCase()]);
      }
    }

    // 📦 Fetch employees
    const { count, rows: employees } = await Employee.findAndCountAll({
      attributes: [
        "id",
        "address_1",
        "address_2",
        "city",
        "state",
        "type",
        "status",
        "mobile_phone",
        "phone",
        "snf",
        "comments",
        "number_id",
        "postal_code",
      ],
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "first_name", "last_name", "email", "image_url"],
          where: userWhereClause,
        },
      ],
      where: whereClause,
      // limit: parseInt(limit),
      // offset,
      order,
    });

    res.status(200).json({
      employees,
      total: count,
      hasMore: offset + employees.length < count,
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

    // Fetch timesheet_amount from admin_configs
    let timesheetAmount = 0.5; // Default value
    const adminConfig = await AdminConfig.findOne({
      where: { user_id: req.user.userId },
      attributes: ["timesheet_amount"],
    });
    if (adminConfig && adminConfig.timesheet_amount) {
      timesheetAmount = adminConfig.timesheet_amount;
    }

    return res.json({
      ...user.toJSON(),
      notification_preference: employee
        ? employee.getDataValue("notification_preference")
        : "email", // Default to "email"
      timesheet_amount: timesheetAmount,
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

exports.getEmployeeSchedulesLocationWeek = async (req, res) => {
  try {
    const { employee_id, location_id, date_range } = req.body;

    const [fromDate, toDate] = date_range.map((date) =>
      moment(date).format("YYYY-MM-DD"),
    );

    const schedules = await Schedule.findAll({
      where: {
        employee_id,
        is_deleted: false,
        start_date: { [Op.lte]: toDate },
        end_date: { [Op.gte]: fromDate },
      },
      include: [
        {
          model: Event,
          where: {
            location_id,
          },
        },
        {
          model: Employee,
        },
      ],
    });

    const resultByWeek = {};

    for (const schedule of schedules) {
      const start = moment.max(moment(schedule.start_date), moment(fromDate));
      const end = moment.min(moment(schedule.end_date), moment(toDate));

      const startTime = moment(schedule.start_time, "HH:mm:ss");
      const endTime = moment(schedule.end_time, "HH:mm:ss");
      const dailyDuration = moment.duration(endTime.diff(startTime)).asHours();

      for (
        let day = start.clone();
        day.isSameOrBefore(end);
        day.add(1, "day")
      ) {
        const weekStart = day.clone().startOf("isoWeek");
        const weekEnd = day.clone().endOf("isoWeek");
        const weekLabel = `${weekStart.format(
          "MMMM D, YYYY",
        )} - ${weekEnd.format("MMMM D, YYYY")}`;

        if (!resultByWeek[weekLabel]) {
          resultByWeek[weekLabel] = {
            total_hours: 0,
            events: [],
          };
        }

        // Find or create event summary in the week's events list
        let eventSummary = resultByWeek[weekLabel].events.find(
          (e) =>
            e.title === schedule.title &&
            e.start_time === schedule.start_time &&
            e.end_time === schedule.end_time,
        );

        if (!eventSummary) {
          eventSummary = {
            title: schedule.title,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            duration_hours_per_day: dailyDuration,
            total_days: 0,
          };
          resultByWeek[weekLabel].events.push(eventSummary);
        }

        // Accumulate
        eventSummary.total_days += 1;
        resultByWeek[weekLabel].total_hours += dailyDuration;
      }
    }

    res.json({ success: true, schedules_by_week: resultByWeek });
  } catch (err) {
    console.error("Error fetching weekly schedules:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.getLocationScheduleWeek = async (req, res) => {
  try {
    const { location_id, date_range } = req.body;

    const [startDate, endDate] = date_range.map((d) =>
      moment(d).startOf("day").toDate(),
    );

    // Fetch all schedules for given location within date range
    const schedules = await Schedule.findAll({
      where: {
        start_date: { [Op.lte]: endDate },
        end_date: { [Op.gte]: startDate },
        is_deleted: false,
      },
      include: [
        {
          model: Event,
          where: { location_id },
          required: true,
        },
        {
          model: Employee,
          include: [
            { model: User, attributes: ["first_name", "last_name", "id"] },
          ],
        },
      ],
    });

    const weeklyData = {};

    console.log(schedules.length, "===================");

    schedules.forEach((schedule) => {
      const start = moment.max(moment(schedule.start_date), moment(startDate));
      const end = moment.min(moment(schedule.end_date), moment(endDate));
      const dailyDuration = moment(schedule.end_time, "HH:mm:ss").diff(
        moment(schedule.start_time, "HH:mm:ss"),
        "hours",
      );

      const employeeName = `${schedule.Employee.User.first_name} ${schedule.Employee.User.last_name}`;

      for (
        let day = start.clone();
        day.isSameOrBefore(end, "day");
        day.add(1, "day")
      ) {
        const weekStart = day.clone().startOf("week").format("MMMM D, YYYY");
        const weekEnd = day.clone().endOf("week").format("MMMM D, YYYY");
        const weekKey = `${weekStart} - ${weekEnd}`;

        if (!weeklyData[weekKey]) weeklyData[weekKey] = {};

        if (!weeklyData[weekKey][employeeName])
          weeklyData[weekKey][employeeName] = 0;

        weeklyData[weekKey][employeeName] += dailyDuration;
      }
    });

    // Format final output
    const result = {};
    Object.entries(weeklyData).forEach(([week, employeeMap]) => {
      result[week] = Object.entries(employeeMap).map(
        ([employee_name, total_hours]) => ({
          employee_name,
          total_hours,
        }),
      );
    });

    return res.json(result);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch employee with user details, ensuring user is not soft deleted
    const employee = await Employee.findOne({
      where: { id },
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name", "email", "image_url"],
          where: { deleted_at: null }, // Exclude soft-deleted users
        },
        {
          model: Restriction,
          as: "restrictions", // ⬅️ Make sure this matches your association alias
          through: {
            attributes: ["active_date", "inactive_date"], // <--- FIX IS HERE!
          }, // remove join table data
        },
        {
          model: RecurringBlockedTime,
          as: "recurringBlockedTimes",
        },
        {
          model: TimeOff,
          as: "timeOffs",
        },
      ],
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

// exports.updateEmployee = async (req, res) => {
//   const transaction = await sequelize.transaction();

//   try {
//     const { id } = req.params;
//     const {
//       firstName,
//       lastName,
//       email,
//       address1,
//       address2,
//       city,
//       state,
//       zip,
//       homePhone,
//       mobilePhone,
//       birthdate,
//       status,
//       comments,
//       SSN,
//       SN,
//       numberId,
//       type,
//       inactive_reason,
//       FDC,
//       GES,
//       DrvLic,
//       four,
//     } = req.body;

//     // Parse complex FormData fields
//     let selectedRestrictions = [];
//     let recurringTimes = [];
//     let timeOffs = [];

//     try {
//       if (req.body.selectedRestrictions) {
//         selectedRestrictions = JSON.parse(req.body.selectedRestrictions);
//       }
//       if (req.body.recurringTimes) {
//         recurringTimes = JSON.parse(req.body.recurringTimes);
//       }
//       if (req.body.timeOffs) {
//         timeOffs = JSON.parse(req.body.timeOffs);
//       }
//     } catch (parseErr) {
//       await transaction.rollback();
//       return res
//         .status(400)
//         .json({ message: "Invalid JSON fields in request" });
//     }

//     const employee = await Employee.findByPk(id, { transaction });
//     if (!employee) {
//       await transaction.rollback();
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     const user = await User.findByPk(employee.user_id, { transaction });
//     if (!user) {
//       await transaction.rollback();
//       return res.status(404).json({ message: "User not found" });
//     }

//     console.log(
//       email,
//       user.email,
//       "=== User found for update",
//       email && email !== user.email,
//     );
//     // Check if email changed
//     if (email && email !== user.email) {
//       const existingUser = await User.findOne({
//         where: { email },
//         transaction,
//       });
//       if (existingUser) {
//         await transaction.rollback();
//         return res.status(400).json({ message: "Email already in use" });
//       }
//     }

//     const image_url = req.file
//       ? `/uploads/${req.file.filename}`
//       : user.image_url;

//     // Update User
//     await user.update(
//       {
//         first_name: firstName,
//         last_name: lastName,
//         email,
//         role_id: 3,
//         image_url,
//       },
//       { transaction },
//     );

//     // Update Employee
//     await employee.update(
//       {
//         address_1: address1,
//         address_2: address2,
//         city,
//         state,
//         postal_code: zip,
//         phone: homePhone,
//         mobile_phone: mobilePhone,
//         date_of_birth: birthdate,
//         status,
//         comments,
//         ssn: SSN,
//         snf: SN,
//         number_id: numberId,
//         type,
//         inactive_reason,
//         fdc: FDC,
//         ges: GES,
//         drv_lic: DrvLic,
//         four,
//       },
//       { transaction },
//     );

//     // 🔄 Update Restrictions
//     if (Array.isArray(selectedRestrictions)) {
//       const restrictionIds = selectedRestrictions.map((r) => r.id);
//       await employee.setRestrictions(restrictionIds, { transaction });
//     }

//     // 🔁 Update Recurring Blocked Times
//     await RecurringBlockedTime.destroy({
//       where: { employee_id: id },
//       transaction,
//     });
//     for (const block of recurringTimes) {
//       const { days, startDate, endDate, startTime, endTime } = block;
//       for (const day of days) {
//         await RecurringBlockedTime.create(
//           {
//             employee_id: id,
//             day_of_week: day,
//             start_date: startDate,
//             end_date: endDate,
//             start_time: new Date(startTime).toTimeString().slice(0, 5),
//             end_time: new Date(endTime).toTimeString().slice(0, 5),
//           },
//           { transaction },
//         );
//       }
//     }

//     // 🔁 Update Time Offs
//     await TimeOff.destroy({ where: { employee_id: id }, transaction });
//     for (const timeOff of timeOffs) {
//       await TimeOff.create(
//         {
//           employee_id: id,
//           reason_id: timeOff.reason_id,
//           start_date: timeOff.startDate,
//           end_date: timeOff.endDate,
//           start_time: new Date(timeOff.startTime).toTimeString().slice(0, 5),
//           end_time: new Date(timeOff.endTime).toTimeString().slice(0, 5),
//         },
//         { transaction },
//       );
//     }

//     await transaction.commit();

//     const updatedEmployee = {
//       ...employee.toJSON(),
//       User: user.toJSON(),
//     };

//     res.status(200).json({
//       message: "Employee updated successfully",
//       employee: updatedEmployee,
//     });
//   } catch (error) {
//     console.error("Error updating employee:", error);
//     await transaction.rollback();
//     res.status(500).json({ message: "Internal Server Error", error });
//   }
// };

exports.updateEmployee = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      address1,
      address2,
      city,
      state,
      zip,
      employer,
      homePhone,
      mobilePhone,
      birthdate,
      status,
      comments,
      SSN,
      SN,
      numberId,
      type,
      inactive_reason,
      FDC,
      GES,
      DrvLic,
      four,
    } = req.body;

    // Parse complex FormData fields
    let selectedRestrictions = [];
    let recurringTimes = [];
    let timeOffs = [];

    console.log("Employee Update", req.body);

    try {
      if (req.body.selectedRestrictions) {
        selectedRestrictions = JSON.parse(req.body.selectedRestrictions);
      }
      if (req.body.recurringTimes) {
        recurringTimes = JSON.parse(req.body.recurringTimes);
      }
      if (req.body.timeOffs) {
        timeOffs = JSON.parse(req.body.timeOffs);
      }
    } catch (parseErr) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "Invalid JSON fields in request" });
    }

    const employee = await Employee.findByPk(id, { transaction });
    if (!employee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Employee not found" });
    }

    const user = await User.findByPk(employee.user_id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email changed
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

    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : user.image_url;

    // Update User
    await user.update(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        role_id: 3,
        image_url,
      },
      { transaction },
    );

    // Update Employee
    await employee.update(
      {
        address_1: address1,
        address_2: address2,
        city,
        state,
        postal_code: zip,
        employer,
        phone: homePhone,
        mobile_phone: mobilePhone,
        date_of_birth: birthdate, // Frontend sends Date object/ISO string, Sequelize handles it
        status,
        comments,
        ssn: SSN,
        snf: SN,
        number_id: numberId,
        type,
        inactive_reason,
        fdc: FDC,
        ges: GES,
        drv_lic: DrvLic,
        four,
      },
      { transaction },
    );

    // ====================================================================
    // 🔄 Update Restrictions with active_date and inactive_date (Delta Update)
    // ====================================================================
    if (Array.isArray(selectedRestrictions)) {
      const restrictionAssociations = selectedRestrictions.map((r) => ({
        restriction_id: r.id,
        active_date: r.active_date ? r.active_date : null,
        inactive_date: r.inactive_date ? r.inactive_date : null,
      }));

      const currentEmployeeRestrictions = await employee.getRestrictions({
        transaction,
        joinTableAttributes: ["active_date", "inactive_date"],
      });
      const currentRestrictionMap = new Map(
        currentEmployeeRestrictions.map((r) => [
          r.id,
          {
            active_date: r.EmployeeRestriction.active_date,
            inactive_date: r.EmployeeRestriction.inactive_date,
          },
        ]),
      );

      const restrictionsToAdd = [];
      const restrictionsToUpdate = [];
      const restrictionsToRemoveIds = new Set(currentRestrictionMap.keys());

      for (const newRestriction of restrictionAssociations) {
        const existingJunctionData = currentRestrictionMap.get(
          newRestriction.restriction_id,
        );

        if (existingJunctionData) {
          const currentActiveDate = existingJunctionData.active_date
            ? existingJunctionData.active_date
            : null;
          const currentInactiveDate = existingJunctionData.inactive_date
            ? existingJunctionData.inactive_date
            : null;

          if (
            currentActiveDate !== newRestriction.active_date ||
            currentInactiveDate !== newRestriction.inactive_date
          ) {
            restrictionsToUpdate.push(newRestriction);
          }
          restrictionsToRemoveIds.delete(newRestriction.restriction_id);
        } else {
          restrictionsToAdd.push(newRestriction);
        }
      }

      if (restrictionsToRemoveIds.size > 0) {
        await employee.removeRestrictions(Array.from(restrictionsToRemoveIds), {
          transaction,
        });
      }

      for (const restriction of restrictionsToAdd) {
        await employee.addRestriction(restriction.restriction_id, {
          through: {
            active_date: restriction.active_date,
            inactive_date: restriction.inactive_date,
          },
          transaction,
        });
      }

      for (const restriction of restrictionsToUpdate) {
        await EmployeeRestriction.update(
          {
            active_date: restriction.active_date,
            inactive_date: restriction.inactive_date,
          },
          {
            where: {
              employee_id: id,
              restriction_id: restriction.restriction_id,
            },
            transaction,
          },
        );
      }
    }

    // ====================================================================
    // 🔁 NEW: Update Recurring Blocked Times (Delta Update)
    // ====================================================================
    if (Array.isArray(recurringTimes)) {
      // Normalize incoming data for comparison
      const normalizedIncomingRecurringTimes = [];
      for (const block of recurringTimes) {
        if (!Array.isArray(block.days) || block.days.length === 0) continue; // Skip invalid blocks
        for (const day of block.days) {
          normalizedIncomingRecurringTimes.push({
            // Frontend sends Date objects, convert to consistent format for comparison/storage
            start_date: block.startDate
              ? new Date(block.startDate).toISOString().split("T")[0]
              : null,
            end_date: block.endDate
              ? new Date(block.endDate).toISOString().split("T")[0]
              : null,
            start_time: block.startTime
              ? block.startTime.match(/^\d{2}:\d{2}$/)
                ? `${block.startTime}:00`
                : block.startTime
              : null,
            end_time: block.endTime
              ? block.endTime.match(/^\d{2}:\d{2}$/)
                ? `${block.endTime}:00`
                : block.endTime
              : null,
            day_of_week: day,
          });
        }
      }

      const currentRecurringTimes = await RecurringBlockedTime.findAll({
        where: { employee_id: id },
        transaction,
      });

      const toAdd = [];
      const toUpdate = [];
      const toRemoveIds = new Set(currentRecurringTimes.map((rt) => rt.id));

      for (const incomingBlock of normalizedIncomingRecurringTimes) {
        const existingBlock = currentRecurringTimes.find(
          (rt) =>
            rt.day_of_week === incomingBlock.day_of_week &&
            rt.start_date === incomingBlock.start_date &&
            rt.end_date === incomingBlock.end_date &&
            rt.start_time === incomingBlock.start_time &&
            rt.end_time === incomingBlock.end_time,
        );

        if (existingBlock) {
          // If a matching block is found, it means it already exists and is not modified
          toRemoveIds.delete(existingBlock.id); // Keep this one
        } else {
          // If no matching block, it's a new one to add
          toAdd.push(incomingBlock);
        }
      }

      // Remove items that are no longer present
      if (toRemoveIds.size > 0) {
        await RecurringBlockedTime.destroy({
          where: { id: { [Op.in]: Array.from(toRemoveIds) } },
          transaction,
        });
      }

      // Add new items
      for (const blockData of toAdd) {
        await RecurringBlockedTime.create(
          { employee_id: id, ...blockData },
          { transaction },
        );
      }
      // Note: For recurring times, updates are tricky because they are defined by unique combinations
      // of dates/times/days. If a date/time/day combination changes, it's essentially a new entry.
      // So, the above add/remove logic is the most practical "update" for this structure.
      // We are not handling "updates" of individual fields within an existing item if its identifying characteristics change,
      // as that would imply we track by a unique ID, which incoming `recurringTimes` lack at the block level.
    }

    // ====================================================================
    // 🔁 NEW: Update Time Offs (Delta Update)
    // ====================================================================
    if (Array.isArray(timeOffs)) {
      const normalizedIncomingTimeOffs = timeOffs
        .map((to) => ({
          // Ensure reason_id is integer and other fields are formatted
          reason_id: parseInt(to.reason_id),
          start_date: to.startDate
            ? new Date(to.startDate).toISOString().split("T")[0]
            : null,
          end_date: to.endDate
            ? new Date(to.endDate).toISOString().split("T")[0]
            : null,
          start_time: to.startTime
            ? to.startTime.match(/^\d{2}:\d{2}$/)
              ? `${to.startTime}:00`
              : to.startTime
            : null,
          end_time: to.endTime
            ? to.endTime.match(/^\d{2}:\d{2}$/)
              ? `${to.endTime}:00`
              : to.endTime
            : null,
          // If frontend sends an `id` for existing time-offs, include it for matching
          id: to.id || null,
        }))
        .filter((to) => to.reason_id && !isNaN(to.reason_id)); // Filter out invalid entries

      const currentTimeOffs = await TimeOff.findAll({
        where: { employee_id: id },
        transaction,
      });

      const toAdd = [];
      const toUpdate = [];
      const toRemoveIds = new Set(currentTimeOffs.map((to) => to.id));

      for (const incomingTimeOff of normalizedIncomingTimeOffs) {
        if (incomingTimeOff.id) {
          // This time-off has an ID, so it's an existing one
          const existingTimeOff = currentTimeOffs.find(
            (to) => to.id === incomingTimeOff.id,
          );
          if (existingTimeOff) {
            // Check if anything actually changed
            const hasChanged =
              existingTimeOff.reason_id !== incomingTimeOff.reason_id ||
              (existingTimeOff.start_date?.toISOString().split("T")[0] ||
                null) !== incomingTimeOff.start_date ||
              (existingTimeOff.end_date?.toISOString().split("T")[0] ||
                null) !== incomingTimeOff.end_date ||
              (existingTimeOff.start_time?.slice(0, 5) || null) !==
                incomingTimeOff.start_time || // Compare slices
              (existingTimeOff.end_time?.slice(0, 5) || null) !==
                incomingTimeOff.end_time;

            if (hasChanged) {
              toUpdate.push(incomingTimeOff);
            }
            toRemoveIds.delete(incomingTimeOff.id); // Keep this one, it's either unchanged or updated
          } else {
            // This is an incoming time-off with an ID that doesn't exist in current - likely a new one
            // This might happen if ID was generated on frontend for temporary use.
            toAdd.push(incomingTimeOff);
          }
        } else {
          // No ID from frontend, must be a new one
          toAdd.push(incomingTimeOff);
        }
      }

      // Remove items no longer present
      if (toRemoveIds.size > 0) {
        await TimeOff.destroy({
          where: { id: { [Op.in]: Array.from(toRemoveIds) } },
          transaction,
        });
      }

      // Add new items
      for (const timeOffData of toAdd) {
        // Ensure not to pass the temporary frontend ID if it's not a valid DB ID
        const { id: tempId, ...dataToCreate } = timeOffData;
        await TimeOff.create(
          { employee_id: id, ...dataToCreate },
          { transaction },
        );
      }

      // Update existing items
      for (const timeOffData of toUpdate) {
        await TimeOff.update(
          {
            reason_id: timeOffData.reason_id,
            start_date: timeOffData.start_date,
            end_date: timeOffData.end_date,
            start_time: timeOffData.start_time,
            end_time: timeOffData.end_time,
          },
          {
            where: { id: timeOffData.id },
            transaction,
          },
        );
      }
    }

    await transaction.commit();

    // To return the fully updated employee, including related data
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        { model: User },
        {
          model: Restriction,
          as: "restrictions",
          through: {
            attributes: ["active_date", "inactive_date"],
          },
        },
        { model: RecurringBlockedTime, as: "recurringBlockedTimes" },
        { model: TimeOff, as: "timeOffs" },
      ],
      transaction: null, // Fetch outside the current transaction, or create a new one.
    });

    res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    if (error.errors) {
      error.errors.forEach((err) =>
        console.error(
          `Sequelize Error: ${err.message} - Path: ${err.path} - Value: ${err.value}`,
        ),
      );
    }
    await transaction.rollback();
    res.status(500).json({ message: "Internal Server Error", error });
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

    console.log(user, "=********* User", employee);

    // await user.update({ deleted_at: new Date() });
    await user.destroy();
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
          required: true,
        },
      ],
      where: {
        status: "active",
      },
      order: [[{ model: User, as: "User" }, "first_name", "ASC"]], // Sort by User's first_name in ascending order
      attributes: ["id", "user_id", "type"], // Only get specific columns
    });

    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTimesheetAmount = async (req, res) => {
  try {
    const { timesheet_amount } = req.body;

    if (timesheet_amount === undefined || timesheet_amount === null) {
      return res.status(400).json({
        success: false,
        message: "timesheet_amount is required",
      });
    }

    if (timesheet_amount < 0) {
      return res.status(400).json({
        success: false,
        message: "timesheet_amount cannot be negative",
      });
    }

    const userId = req.user.userId;

    // Check if admin config exists for this user
    let adminConfig = await AdminConfig.findOne({
      where: { user_id: userId },
    });

    if (adminConfig) {
      // Update existing config
      await adminConfig.update({ timesheet_amount });
    } else {
      // Create new config
      adminConfig = await AdminConfig.create({
        user_id: userId,
        timesheet_amount,
      });
    }

    return res.json({
      success: true,
      message: "Timesheet amount updated successfully",
      timesheet_amount: parseFloat(adminConfig.timesheet_amount),
    });
  } catch (error) {
    console.error("Error updating timesheet amount:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
