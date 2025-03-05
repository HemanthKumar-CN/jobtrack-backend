const express = require("express");
const router = express.Router();
const upload = require("../config/multerConfig");
const {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");

router.post("/locations", upload.single("image"), createLocation); // Upload single image
router.get("/locations", getLocations);
router.put("/locations/:id", upload.single("image"), updateLocation);
router.delete("/locations/:id", deleteLocation);

module.exports = router;
