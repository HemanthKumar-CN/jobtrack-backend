const express = require("express");
const {
  getAllClassifications,
} = require("../controllers/classificationController");
const router = express.Router();

// GET all contractors
router.get("/", getAllClassifications);

module.exports = router;
