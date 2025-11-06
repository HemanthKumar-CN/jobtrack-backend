const express = require("express");
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventList,
  getActiveEventLocations,
} = require("../controllers/eventController");
const router = express.Router();

router.post("/", createEvent); // Create
router.get("/", getAllEvents);
router.get("/event-list", getEventList);
router.get("/active-event-locations/:date", getActiveEventLocations);
router.get("/:id", getEventById);
router.put("/:id", updateEvent); // Update an event by ID
router.delete("/:id", deleteEvent);

module.exports = router;
