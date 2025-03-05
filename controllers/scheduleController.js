const { Op } = require("sequelize");
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const Schedule = require("../models/Schedule");
const Employee = require("../models/Employee");
const Location = require("../models/Location");
const moment = require("moment");

// Create Schedule
const createSchedule = async (req, res) => {
  try {
    const { employee_id, location_id, shift_date, start_time, end_time } =
      req.body;

    if (
      !employee_id ||
      !location_id ||
      !shift_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (start_time >= end_time) {
      return res
        .status(400)
        .json({ error: "Start time must be before end time" });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employee_id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Check if location exists
    const location = await Location.findByPk(location_id);
    if (!location) return res.status(404).json({ error: "Location not found" });

    // Check for overlapping shifts
    const existingSchedule = await Schedule.findOne({
      where: {
        employee_id,
        shift_date,
        [Op.or]: [
          { start_time: { [Op.between]: [start_time, end_time] } },
          { end_time: { [Op.between]: [start_time, end_time] } },
        ],
        is_deleted: false,
      },
    });

    if (existingSchedule) {
      return res
        .status(400)
        .json({ error: "Employee already scheduled for this time" });
    }

    // Create schedule if no conflicts
    const schedule = await Schedule.create({
      employee_id,
      location_id,
      shift_date,
      start_time,
      end_time,
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Schedules
const getSchedules = async (req, res) => {
  try {
    const {
      employee_id,
      location_id,
      start_date,
      end_date,
      page = 1,
      limit = 10,
    } = req.query;

    const whereClause = { is_deleted: false };

    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;
    if (start_date && end_date) {
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    }

    const offset = (page - 1) * limit;

    const schedules = await Schedule.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["shift_date", "ASC"]],
    });

    res.status(200).json({
      total: schedules.count,
      pages: Math.ceil(schedules.count / limit),
      data: schedules.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Schedule
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
  getSchedules,
  updateSchedule,
  deleteSchedule,
  getSchedulesReport,
  exportSchedulesCSV,
  exportSchedulesExcel,
  checkEmployeeAvailability,
  exportSchedulesByLocationCSV,
  exportExceeding40HoursReport,
};
