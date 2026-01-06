const express = require("express");
const {
  searchEmployees,
  getEmployeeTimesheets,
} = require("../controllers/reportController");
const router = express.Router();

// Search employees by name, ges, or four
router.get("/search-employees", searchEmployees);

// Get timesheet data for a specific employee
router.get("/employee-timesheets", getEmployeeTimesheets);

module.exports = router;
