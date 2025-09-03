const express = require("express");
const {
  getAdminConfigs,
  createOrUpdateAdminConfig,
} = require("../controllers/adminConfigsController");
const router = express.Router();

router.get("/", getAdminConfigs);
router.post("/", createOrUpdateAdminConfig);

module.exports = router;
