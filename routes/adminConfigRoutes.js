const express = require("express");
const {
  getAdminConfigs,
  createOrUpdateAdminConfig,
  updatePhoneNumber,
  updateOrganization,
} = require("../controllers/adminConfigsController");
const router = express.Router();

router.get("/", getAdminConfigs);
router.post("/", createOrUpdateAdminConfig);
router.put("/admin-phone", updatePhoneNumber);
router.put("/organization", updateOrganization);

module.exports = router;
