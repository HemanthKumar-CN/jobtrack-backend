const express = require("express");
const router = express.Router();
const upload = require("../config/multerConfig");
const {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
  getLocationById,
  getAllLocations,
  dashboardLocation,
  dashboardItems,
} = require("../controllers/locationController");

router.post("/", upload.single("image"), createLocation); // Upload single image
router.get("/", getLocations);
router.get("/employeeCount", dashboardLocation);
router.get("/dashboard", dashboardItems);
router.get("/all", getAllLocations);
router.get("/:id", getLocationById);
router.put("/:id", upload.single("image"), updateLocation);
router.delete("/:id", deleteLocation);

module.exports = router;
