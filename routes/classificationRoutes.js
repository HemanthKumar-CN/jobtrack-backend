const express = require("express");
const {
  getAllClassifications,
  updateClassification,
  createClassification,
} = require("../controllers/classificationController");
const router = express.Router();

// GET all contractors
router.get("/", getAllClassifications);
router.put("/:id", updateClassification);
router.post("/", createClassification);

module.exports = router;
