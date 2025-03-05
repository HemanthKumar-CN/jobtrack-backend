const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");

router.post("/", employeeController.createEmployee); // Create
router.get("/", employeeController.getAllEmployees); // Read All
router.get("/:id", employeeController.getEmployeeById); // Read One
router.put("/:id", employeeController.updateEmployee); // Update
router.delete("/:id", employeeController.softDeleteEmployee); // Soft Delete

module.exports = router;
