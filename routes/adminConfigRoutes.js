const express = require("express");
const {
  getAdminConfigs,
  createOrUpdateAdminConfig,
  updatePhoneNumber,
} = require("../controllers/adminConfigsController");
const router = express.Router();

router.get("/", getAdminConfigs);
router.post("/", createOrUpdateAdminConfig);
router.put("/admin-phone", updatePhoneNumber);

module.exports = router;
