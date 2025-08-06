const express = require("express");
const {
  getAllRestrictions,
  bulkCreate,
  updateRestriction,
} = require("../controllers/restrictionController");
const router = express.Router();

// GET all contractors
router.get("/", getAllRestrictions);
router.post("/bulk-create", bulkCreate);
router.put("/:id", updateRestriction);

module.exports = router;
