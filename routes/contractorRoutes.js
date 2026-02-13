const express = require("express");
const router = express.Router();
const {
  getAllContractors,
  createContractor,
  updateContractorById,
  deleteContractor,
  getContractorById,
  getContractsDropdown,
  getAllContractorsWhoAreEmployers,
} = require("../controllers/contractorController");

// GET all contractors
router.get("/", getAllContractors);
router.get("/list", getContractsDropdown);

// POST a new contractor
router.post("/", createContractor);

router.get("/employer-list", getAllContractorsWhoAreEmployers); // Get all employers

// PUT (update) a contractor by ID
router.put("/:id", updateContractorById);

router.get("/:id", getContractorById); // Get contractor by ID
router.delete("/:id", deleteContractor); // Delete contractor by ID

module.exports = router;
