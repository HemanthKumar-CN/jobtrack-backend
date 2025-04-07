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

router.post("/api/locations", upload.single("image"), createLocation); // Upload single image
router.get("/api/locations", getLocations);
router.get("/api/locations/employeeCount", dashboardLocation);
router.get("/api/locations/dashboard", dashboardItems);
router.get("/api/locations/all", getAllLocations);
router.get("/api/locations/:id", getLocationById);
router.put("/api/locations/:id", upload.single("image"), updateLocation);
router.delete("/api/locations/:id", deleteLocation);

module.exports = router;
