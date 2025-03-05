const express = require("express");
const router = express.Router();
const {
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
  checkEmployeeAvailability,
  getSchedulesReport,
  exportSchedulesCSV,
  exportSchedulesExcel,
  exportSchedulesByLocationCSV, // Added
  exportExceeding40HoursReport,
} = require("../controllers/scheduleController");

router.post("/", createSchedule);
router.get("/", getSchedules);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule); // Soft delete
router.get("/check-availability", checkEmployeeAvailability);
router.get("/report", getSchedulesReport);
router.get("/export/csv", exportSchedulesCSV);
router.get("/export/excel", exportSchedulesExcel);
router.get("/export/location/csv", exportSchedulesByLocationCSV); // Export by location, employee, and date
router.get("/export/overtime/csv", exportExceeding40HoursReport); // Exceeding 40 hours report

module.exports = router;
