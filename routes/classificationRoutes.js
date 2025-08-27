const express = require("express");
const {
  getAllClassifications,
  updateClassification,
} = require("../controllers/classificationController");
const router = express.Router();

// GET all contractors
router.get("/", getAllClassifications);
router.put("/:id", updateClassification);

module.exports = router;
