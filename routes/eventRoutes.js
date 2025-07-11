const express = require("express");
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventList,
} = require("../controllers/eventController");
const router = express.Router();

router.post("/", createEvent); // Create
router.get("/", getAllEvents);
router.get("/event-list", getEventList);
router.get("/:id", getEventById);
router.put("/:id", updateEvent); // Update an event by ID
router.delete("/:id", deleteEvent); // Delete an event by ID

module.exports = router;
