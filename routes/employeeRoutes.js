const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const upload = require("../config/multerConfig");

router.post("/", upload.single("image"), employeeController.createEmployee); // Create
router.get("/", employeeController.getAllEmployees); // Read All
router.get("/me", employeeController.getEmployeeAbout); // Read All
router.get("/profile", employeeController.getEmployeeProfile);
router.put(
  "/notification-preference",
  employeeController.updateNotificationPreference,
);
router.post(
  "/upload-profile-pic",
  upload.single("image"),
  employeeController.updateMyProfilePic,
);

router.get("/list", employeeController.getEmployeesList); // Get List
router.get("/:id", employeeController.getEmployeeById); // Read One
router.put("/:id", upload.single("image"), employeeController.updateEmployee); // Update
router.delete("/:id", employeeController.softDeleteEmployee); // Soft Delete
router.put("/update-personalInfo/:id", employeeController.updatePersonalInfo);

router.post(
  "/employee-hours-week",
  employeeController.getEmployeeSchedulesWeek,
);

module.exports = router;
