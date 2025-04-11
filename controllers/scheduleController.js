const { Op, Sequelize, fn, col, literal } = require("sequelize");
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const Schedule = require("../models/Schedule");
const Employee = require("../models/Employee");
const Location = require("../models/Location");
const moment = require("moment");
const Event = require("../models/Events");
const User = require("../models/User");
const sequelize = require("../config/database");

// Create Schedule
const createSchedule = async (req, res) => {
  try {
    const { employee_id, location_id, shift_date } = req.body;

    if (!employee_id || !location_id || !shift_date) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employee_id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Check if location exists
    const location = await Location.findByPk(location_id);
    if (!location) return res.status(404).json({ error: "Location not found" });

    // Create schedule if no conflicts
    const schedule = await Schedule.create({
      employee_id,
      location_id,
      shift_date,
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const createBulkSchedule = async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       taskEvent,
//       title,
//       description,
//       selectedEmployees,
//     } = req.body;

//     if (
//       !startDate ||
//       !endDate ||
//       !taskEvent ||
//       !title ||
//       !selectedEmployees.length
//     ) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     console.log(startDate, endDate, "====**********");

//     const employeeIds = selectedEmployees.map((emp) => emp.value);

//     // Convert frontend input (local time) to full UTC format
//     const startDateUTC = moment(startDate, "YYYY-MM-DDTHH:mm").utc().format();

//     const endDateUTC = moment(endDate, "YYYY-MM-DDTHH:mm").utc().format();

//     console.log(startDateUTC, endDateUTC, "====%%%%%%%%%%%%5*");

//     // Fetch existing schedules that overlap with the given time slot
//     const existingSchedules = await Schedule.findAll({
//       where: {
//         employee_id: employeeIds,
//         start_date: { [Op.lte]: endDateUTC },
//         end_date: { [Op.gte]: startDateUTC },
//       },
//       include: [
//         {
//           model: Employee,
//           attributes: ["id", "user_id"],
//           include: [
//             {
//               model: User,
//               attributes: ["first_name", "last_name"],
//             },
//           ],
//         },
//       ],
//     });

//     console.log(existingSchedules, "====**********");

//     // Extract IDs of employees who are already scheduled
//     const occupiedEmployeeIds = existingSchedules.map(
//       (schedule) => schedule.employee_id,
//     );

//     // Get names of occupied employees
//     const occupiedEmployees = existingSchedules.map((schedule) => ({
//       id: schedule.employee_id,
//       name: schedule.Employee?.User
//         ? `${schedule.Employee.User.first_name} ${schedule.Employee.User.last_name}`
//         : "Unknown Employee",
//     }));

//     // Filter out available employees
//     const availableEmployees = selectedEmployees.filter(
//       (emp) => !occupiedEmployeeIds.includes(emp.value),
//     );

//     if (availableEmployees.length > 0) {
//       // Prepare schedules for available employees
//       const schedules = availableEmployees.map((emp) => ({
//         employee_id: emp.value,
//         task_event_id: taskEvent,
//         title,
//         description,
//         start_date: startDate,
//         end_date: endDate,
//         status: "scheduled",
//       }));

//       await Schedule.bulkCreate(schedules);
//     }

//     return res.status(201).json({
//       message: availableEmployees.length
//         ? "Schedules created successfully for available employees."
//         : "No schedules were created as all employees were occupied.",
//       occupiedEmployees,
//       createdSchedules: {
//         employees: availableEmployees.map((emp) => ({
//           id: emp.value,
//           name: emp.label, // Assuming the frontend sends employee name in `label`
//         })),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Get Schedules

const createBulkSchedule = async (req, res) => {
  try {
    const {
      startDate, // Example: "2025-03-16T03:45"
      endDate, // Example: "2025-03-20T06:45"
      taskEvent,
      title,
      description,
      selectedEmployees,
    } = req.body;

    if (
      !startDate ||
      !endDate ||
      !taskEvent ||
      !title ||
      !selectedEmployees.length
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log(startDate, endDate, "====**********");

    const employeeIds = selectedEmployees.map((emp) => emp.value);

    // Convert input to UTC format for storage
    // ✅ Step 1: Convert to UTC
    const startDateUTC = moment(startDate).utc();
    const endDateUTC = moment(endDate).utc();

    // ✅ Step 2: Extract UTC date and time separately
    const newStartDate = startDateUTC.format("YYYY-MM-DD"); // Extract only date
    const newEndDate = endDateUTC.format("YYYY-MM-DD"); // Extract only date
    const newStartTime = startDateUTC.format("HH:mm:ss"); // Extract only time
    const newEndTime = endDateUTC.format("HH:mm:ss"); // Extract only time

    console.log(
      startDateUTC,
      endDateUTC,
      newStartDate,
      newEndDate,
      newStartTime,
      newEndTime,
      "====**********",
    );

    // Fetch existing schedules that overlap
    const existingSchedules = await Schedule.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        start_date: { [Op.lte]: newEndDate },
        end_date: { [Op.gte]: newStartDate },
        [Op.and]: [
          {
            [Op.or]: [
              // Overlapping date range
              {
                start_date: { [Op.lte]: newEndDate },
                end_date: { [Op.gte]: newStartDate },
              },
            ],
          },
          {
            [Op.or]: [
              // Overlapping time range
              {
                start_time: { [Op.lt]: newEndTime },
                end_time: { [Op.gt]: newStartTime },
              },
              {
                start_time: null, // To allow full-day schedules if applicable
                end_time: null,
              },
            ],
          },
        ],
      },
      include: [
        {
          model: Employee,
          attributes: ["id", "user_id"],
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name", "image_url"],
            },
          ],
        },
      ],
    });

    console.log(
      JSON.stringify(existingSchedules, null, 2),
      "==== Existing Schedules",
    );

    // Extract conflicting employees
    const occupiedEmployeeIds = existingSchedules.map(
      (schedule) => schedule.employee_id,
    );
    const occupiedEmployees = existingSchedules.map((schedule) => ({
      id: schedule.employee_id,
      name: schedule.Employee?.User
        ? `${schedule.Employee.User.first_name} ${schedule.Employee.User.last_name}`
        : "Unknown Employee",
    }));

    // Filter out available employees
    const availableEmployees = selectedEmployees.filter(
      (emp) => !occupiedEmployeeIds.includes(emp.value),
    );

    console.log(newStartDate, newEndDate, newStartTime, newEndTime, "==== New");

    let employeesScheduled = [];
    let locationData = null; // ✅ NEW: Store location details

    if (availableEmployees.length > 0) {
      // Prepare and insert schedules for available employees
      const schedules = availableEmployees.map((emp) => ({
        employee_id: emp.value,
        task_event_id: taskEvent,
        title,
        description,
        start_date: newStartDate,
        end_date: newEndDate,
        start_time: newStartTime,
        end_time: newEndTime,
        status: "scheduled",
      }));

      // await Schedule.bulkCreate(schedules);

      await Schedule.bulkCreate(schedules, {
        returning: true,
      });

      console.log(availableEmployees, "==== Available Employees");

      employeesScheduled = availableEmployees.map((emp) => ({
        id: emp.value,
        label: emp.label,
        image_url: emp.imageUrl,
      }));
    }

    // ✅ NEW: Fetch event name from Events table
    const eventDetails = await Event.findOne({
      where: { id: taskEvent },
      attributes: ["event_name", "location_id"],
    });

    // ✅ NEW: Fetch location details from Locations table using location_id
    if (eventDetails && eventDetails.location_id) {
      const locationDetails = await Location.findOne({
        where: { id: eventDetails.location_id }, // ✅ Corrected: Now using location_id
        attributes: [
          "name",
          "address_1",
          "address_2",
          "city",
          "state",
          "postal_code",
        ],
      });

      if (locationDetails) {
        locationData = {
          name: locationDetails.name,
          address1: locationDetails.address_1,
          address2: locationDetails.address_2,
          city: locationDetails.city,
          state: locationDetails.state,
          postalCode: locationDetails.postal_code,
        };
      }
    }

    return res.status(201).json({
      message: availableEmployees.length
        ? "Schedules created successfully for available employees."
        : "No schedules were created as selected employees were occupied.",
      occupiedEmployees,
      scheduledData: availableEmployees.length
        ? {
            title,
            description,
            startDate: moment.utc(newStartDate).local().format("YYYY-MM-DD"),
            endDate: moment.utc(newEndDate).local().format("YYYY-MM-DD"),
            startTime: moment
              .utc(newStartTime, "HH:mm:ss")
              .local()
              .format("hh:mm A"),
            endTime: moment
              .utc(newEndTime, "HH:mm:ss")
              .local()
              .format("hh:mm A"),
            location: locationData, // ✅ NEW
            eventName: eventDetails ? eventDetails.event_name : "Unknown Event", // ✅ NEW

            employees: employeesScheduled,
          }
        : null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

// const getSchedules = async (req, res) => {
//   try {
//     const {
//       employee_id,
//       location_id,
//       start_date,
//       end_date,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const whereClause = { is_deleted: false };

//     if (employee_id) whereClause.employee_id = employee_id;
//     if (location_id) whereClause.location_id = location_id;
//     if (start_date && end_date) {
//       whereClause.shift_date = { [Op.between]: [start_date, end_date] };
//     }

//     const offset = (page - 1) * limit;

//     const schedules = await Schedule.findAndCountAll({
//       where: whereClause,
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//       order: [["shift_date", "ASC"]],
//     });

//     res.status(200).json({
//       total: schedules.count,
//       pages: Math.ceil(schedules.count / limit),
//       data: schedules.rows,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Update Schedule

const getSchedules = async (req, res) => {
  try {
    const { date } = req.params; // Date from request (YYYY-MM-DD)

    // Fetch schedules where the given date is within start_date and end_date range
    const schedules = await Schedule.findAll({
      where: {
        start_date: { [Op.lte]: date }, // start_date <= date
        end_date: { [Op.gte]: date }, // end_date >= date
        is_deleted: false,
      },
      include: [
        {
          model: Employee,
          attributes: ["id", "user_id"],
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name"], // Get user details
            },
          ],
        },
      ],
      order: [["start_time", "ASC"]], // Sort schedules by start time
    });

    // console.log(schedules, "==== Schedules");

    // Format response grouped by user
    const groupedSchedules = schedules.reduce((acc, schedule) => {
      const user = schedule.Employee.User;
      const userId = schedule.Employee.user_id;

      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          first_name: user.first_name,
          last_name: user.last_name,
          schedules: [],
        };
      }

      acc[userId].schedules.push({
        schedule_id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status,
      });

      return acc;
    }, {});

    res.status(200).json(Object.values(groupedSchedules));
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getWeeklySchedules = async (req, res) => {
  try {
    let { currentWeekStart } = req.query;

    if (!currentWeekStart) {
      return res.status(400).json({ error: "currentWeekStart is required" });
    }

    // Convert to Date object
    currentWeekStart = new Date(currentWeekStart);

    // Compute `currentWeekEnd` (Saturday of the same week)
    let currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Add 6 days

    console.log(
      "Fetching schedules from:",
      currentWeekStart,
      "to",
      currentWeekEnd,
    );

    // Fetch schedules that overlap this week
    const schedules = await Schedule.findAll({
      where: {
        [Op.and]: [
          { start_date: { [Op.lte]: currentWeekEnd } }, // Starts before or during the week
          { end_date: { [Op.gte]: currentWeekStart } }, // Ends after or during the week
        ],
      },
      include: [
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
    });

    // Organize data by employee
    const employeeSchedules = {};

    schedules.forEach((schedule) => {
      const user = schedule.Employee?.User;
      if (!user) return;

      if (!employeeSchedules[user.id]) {
        employeeSchedules[user.id] = {
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          schedules: [],
        };
      }

      employeeSchedules[user.id].schedules.push({
        schedule_id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status,
        // days: getScheduleDays(schedule.start_date, schedule.end_date),
      });
    });

    // Convert object to array
    const formattedResponse = Object.values(employeeSchedules);

    res.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching weekly schedules:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMonthlySchedules = async (req, res) => {
  try {
    let { month } = req.params;

    if (!month) {
      return res
        .status(400)
        .json({ error: "month is required (format: YYYY-MM)" });
    }

    // Compute first and last day of the month

    // const startOfMonth = new Date(`${month}-01`);
    // const startOfMonth = new Date(`${month}-01T00:00:00Z`);

    // const endOfMonth = new Date(startOfMonth);
    // endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    // endOfMonth.setDate(0); // Last day of the month

    // Get first and last day of the month in UTC-safe way
    const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
    const [year, monthStr] = month.split("-");
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(monthStr, 10);

    // Get last day of the month
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum, 0)); // 0 means last day of previous month (after month + 1)

    console.log("Fetching schedules from:", startOfMonth, "to", endOfMonth);

    // Fetch schedules that overlap the given month
    const schedules = await Schedule.findAll({
      where: {
        [Op.and]: [
          { start_date: { [Op.lte]: endOfMonth } },
          { end_date: { [Op.gte]: startOfMonth } },
        ],
      },
      include: [
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
        {
          model: Event, // Include event details
          attributes: ["id", "location_id", "event_name"],
          include: [
            {
              model: Location, // Include location details
              attributes: ["id", "name"],
            },
          ],
        },
      ],
    });

    console.log("Fetched schedules:", schedules);

    // Transform data into the required format
    const groupedSchedules = schedules.reduce((acc, schedule) => {
      if (!schedule.Employee || !schedule.Employee.User) return acc;

      const { id, first_name, last_name } = schedule.Employee.User;
      const userKey = id;

      if (!acc[userKey]) {
        acc[userKey] = {
          user_id: id,
          first_name,
          last_name,
          schedules: [],
        };
      }

      acc[userKey].schedules.push({
        schedule_id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        status: schedule.status,
        event_name: schedule.Event?.event_name || "N/A", // Get event_name, fallback to "N/A"
        location_name: schedule.Event?.Location?.name || "N/A", // Get location name, fallback to "N/A"
      });

      return acc;
    }, {});

    // Convert object to array format
    res.json(Object.values(groupedSchedules));
  } catch (error) {
    console.error("Error fetching monthly schedules:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const employeeSchedules = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { status, startDate, endDate } = req.query;

    let whereCondition = {
      employee_id,
      is_deleted: false,
    };

    // Filter by status (optional)
    if (status) {
      whereCondition.status = status;
    }

    console.log(startDate, endDate, "??????????");

    // Filter schedules that overlap with the given date range
    if (startDate && endDate) {
      whereCondition[Op.and] = [
        { start_date: { [Op.lte]: endDate } }, // Starts on or before the requested end_date
        { end_date: { [Op.gte]: startDate } }, // Ends on or after the requested start_date
      ];
    }

    console.log(whereCondition, "?????........");

    const schedules = await Schedule.findAll({
      where: whereCondition,

      include: [
        // { model: Employee, attributes: ["id", "name", "email"] },
        {
          model: Event,
          attributes: ["id", "event_name"],
          include: [
            {
              model: Location,
              attributes: [
                "name",
                "address_1",
                "address_2",
                "city",
                "state",
                "postal_code",
                "image_url",
              ],
            },
          ],
        },
      ],
      order: [
        ["start_date", "ASC"],
        ["start_time", "ASC"],
      ],
    });

    console.log(schedules, "???????///////////////");

    return res.json({ success: true, data: schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { shift_date, start_time, end_time, status } = req.body;

    const schedule = await Schedule.findOne({
      where: { id, is_deleted: false },
    });
    if (!schedule)
      return res.status(404).json({ error: "Schedule not found or deleted" });

    schedule.shift_date = shift_date;
    schedule.start_time = start_time;
    schedule.end_time = end_time;
    schedule.status = status;

    await schedule.save();
    res.status(200).json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const checkEmployeeAvailability = async (req, res) => {
  try {
    const { employee_id, shift_date, start_time, end_time } = req.query;

    if (!employee_id || !shift_date || !start_time || !end_time) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    // Check if the employee has any overlapping shifts
    const conflict = await Schedule.findOne({
      where: {
        employee_id,
        shift_date,
        is_deleted: false,
        [Op.or]: [
          {
            start_time: { [Op.lt]: end_time },
            end_time: { [Op.gt]: start_time },
          },
        ],
      },
    });

    if (conflict) {
      return res.json({
        available: false,
        message: "Employee is already scheduled during this time.",
      });
    }

    res.json({ available: true, message: "Employee is available." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Soft Delete Schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    schedule.is_deleted = true;
    await schedule.save();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSchedulesReport = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, location_id, status } =
      req.query;

    let whereClause = { is_deleted: false };

    if (start_date && end_date) {
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    }
    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;
    if (status) whereClause.status = status;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ["id", "user_id", "position"] },
        { model: Location, attributes: ["id", "name"] },
      ],
    });

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportSchedulesCSV = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, location_id, status } =
      req.query;

    let whereClause = { is_deleted: false };
    if (start_date && end_date)
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;
    if (status) whereClause.status = status;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ["id", "user_id", "position"] },
        { model: Location, attributes: ["id", "name"] },
      ],
    });

    if (schedules.length === 0)
      return res
        .status(404)
        .json({ message: "No schedules found for the given filters" });

    const csvFields = [
      "ID",
      "Employee ID",
      "Location",
      "Date",
      "Start Time",
      "End Time",
      "Status",
    ];
    const csvData = schedules.map((s) => ({
      ID: s.id,
      "Employee ID": s.employee_id,
      Location: s.Location ? s.Location.name : "",
      Date: s.shift_date,
      "Start Time": s.start_time,
      "End Time": s.end_time,
      Status: s.status,
    }));

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(csvData);

    // 🔥 Generate unique filename
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const filePath = path.join(
      __dirname,
      `../exports/schedules_${timestamp}.csv`,
    );

    fs.writeFileSync(filePath, csv);

    res.download(filePath, `schedules_${timestamp}.csv`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportSchedulesExcel = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, location_id, status } =
      req.query;

    let whereClause = { is_deleted: false };
    if (start_date && end_date)
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;
    if (status) whereClause.status = status;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ["id", "user_id", "position"] },
        { model: Location, attributes: ["id", "name"] },
      ],
    });

    if (schedules.length === 0)
      return res
        .status(404)
        .json({ message: "No schedules found for the given filters" });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Schedules");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Employee ID", key: "employee_id", width: 15 },
      { header: "Location", key: "location", width: 20 },
      { header: "Date", key: "shift_date", width: 15 },
      { header: "Start Time", key: "start_time", width: 15 },
      { header: "End Time", key: "end_time", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    schedules.forEach((s) => {
      worksheet.addRow({
        id: s.id,
        employee_id: s.employee_id,
        location: s.Location ? s.Location.name : "",
        shift_date: s.shift_date,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
      });
    });

    // 🔥 Generate unique filename
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const filePath = path.join(
      __dirname,
      `../exports/schedules_${timestamp}.xlsx`,
    );

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, `schedules_${timestamp}.xlsx`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportSchedulesByLocationCSV = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, location_id } = req.query;

    let whereClause = { is_deleted: false };
    if (start_date && end_date)
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ["id", "user_id", "position"] },
        { model: Location, attributes: ["id", "name"] },
      ],
      order: [["shift_date", "ASC"]],
    });

    if (schedules.length === 0)
      return res.status(404).json({ message: "No schedules found" });

    const csvFields = [
      "ID",
      "Employee ID",
      "Location",
      "Date",
      "Start Time",
      "End Time",
      "Status",
    ];
    const csvData = schedules.map((s) => ({
      ID: s.id,
      "Employee ID": s.employee_id,
      Location: s.Location ? s.Location.name : "",
      Date: s.shift_date,
      "Start Time": s.start_time,
      "End Time": s.end_time,
      Status: s.status,
    }));

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(csvData);

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const filePath = path.join(
      __dirname,
      `../exports/schedules_${timestamp}.csv`,
    );

    fs.writeFileSync(filePath, csv);
    res.download(filePath, `schedules_${timestamp}.csv`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportExceeding40HoursReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = { is_deleted: false };
    if (start_date && end_date)
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [{ model: Employee, attributes: ["id", "user_id", "position"] }],
      order: [["shift_date", "ASC"]],
    });

    if (schedules.length === 0)
      return res.status(404).json({ message: "No schedules found" });

    // Group employee hours per week
    let employeeHours = {};

    schedules.forEach((s) => {
      const week = moment(s.shift_date).format("YYYY-WW"); // Get Year-Week format
      const employeeKey = `${s.employee_id}-${week}`;

      const start = moment(s.start_time, "HH:mm:ss");
      const end = moment(s.end_time, "HH:mm:ss");
      const hoursWorked = moment.duration(end.diff(start)).asHours();

      if (!employeeHours[employeeKey]) {
        employeeHours[employeeKey] = {
          employee_id: s.employee_id,
          week,
          total_hours: 0,
        };
      }
      employeeHours[employeeKey].total_hours += hoursWorked;
    });

    // Convert to array and mark employees exceeding 40 hours
    const reportData = Object.values(employeeHours).map((record) => ({
      Employee_ID: record.employee_id,
      Week: record.week,
      Total_Hours: record.total_hours.toFixed(2),
      Notes: record.total_hours > 40 ? "Overtime Exceeded 40 Hours" : "",
    }));

    // Create Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Overtime Report");

    worksheet.columns = [
      { header: "Employee ID", key: "Employee_ID", width: 15 },
      { header: "Week", key: "Week", width: 10 },
      { header: "Total Hours", key: "Total_Hours", width: 15 },
      { header: "Notes", key: "Notes", width: 30 },
    ];

    reportData.forEach((row) => worksheet.addRow(row));

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const filePath = path.join(
      __dirname,
      `../exports/overtime_report_${timestamp}.xlsx`,
    );

    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, `overtime_report_${timestamp}.xlsx`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSchedule,
  createBulkSchedule,
  getSchedules,
  getWeeklySchedules,
  getMonthlySchedules,
  employeeSchedules,
  updateSchedule,
  deleteSchedule,
  getSchedulesReport,
  exportSchedulesCSV,
  exportSchedulesExcel,
  checkEmployeeAvailability,
  exportSchedulesByLocationCSV,
  exportExceeding40HoursReport,
};
