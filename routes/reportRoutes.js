const express = require("express");
const { getEmployeeAndLocations } = require("../controllers/reportController");
const router = express.Router();

router.get("/metadata", getEmployeeAndLocations); // Get

module.exports = router;
