const express = require("express");
const {
  getAdminConfigs,
  createOrUpdateAdminConfig,
  updatePhoneNumber,
  updateOrganization,
  getLabels,
  updateLabels,
} = require("../controllers/adminConfigsController");
const router = express.Router();

router.get("/", getAdminConfigs);
router.post("/", createOrUpdateAdminConfig);
router.put("/admin-phone", updatePhoneNumber);
router.put("/organization", updateOrganization);
router.get("/labels", getLabels);
router.put("/labels", updateLabels);

module.exports = router;
