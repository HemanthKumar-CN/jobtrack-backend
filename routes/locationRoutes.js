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

router.post("/locations", upload.single("image"), createLocation); // Upload single image
router.get("/locations", getLocations);
router.get("/locations/employeeCount", dashboardLocation);
router.get("/locations/dashboard", dashboardItems);
router.get("/locations/all", getAllLocations);
router.get("/locations/:id", getLocationById);
router.put("/locations/:id", upload.single("image"), updateLocation);
router.delete("/locations/:id", deleteLocation);

module.exports = router;
