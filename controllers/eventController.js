const { Op } = require("sequelize");
const Contractor = require("../models/Contractor");
const Event = require("../models/Events");
const Location = require("../models/Location");

// Create Event
const createEvent = async (req, res) => {
  try {
    const { event_name, contractor_id, location_id, start_date, end_date } =
      req.body;

    if (
      !event_name ||
      !contractor_id ||
      !location_id ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    console.log(req.body, "????//////");
    const newEvent = await Event.create({
      event_name,
      contractor_id,
      location_id,
      start_date,
      end_date,
    });

    // Fetch event with associated location and contractor details
    const createdEvent = await Event.findOne({
      where: { id: newEvent.id },
      include: [
        {
          model: Location,
          //   as: "location",
          attributes: ["id", "name"], // Fetch location name
        },
        {
          model: Contractor,
          //   as: "contractor",
          attributes: ["id", "company_name"], // Fetch contractor name
        },
      ],
    });

    res.status(201).json(createdEvent);
  } catch (error) {
    console.log(error, "========");
    res.status(500).json({ error: error.message });
  }
};

// Get All Events
const getAllEvents = async (req, res) => {
  try {
    const { search, sortField, sortOrder } = req.query;

    let whereCondition = {};
    if (search) {
      whereCondition = {
        [Op.or]: [
          { event_name: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search
        ],
      };
    }

    // Build order array dynamically
    let order = [["start_date", "ASC"]]; // default sort
    if (sortField && sortOrder) {
      switch (sortField) {
        case "event_name":
          order = [["event_name", sortOrder]];
          break;
        case "start_date":
          order = [["start_date", sortOrder]];
          break;
        case "end_date":
          order = [["end_date", sortOrder]];
          break;
        case "contractor":
          order = [[Contractor, "company_name", sortOrder]];
          break;
        case "location":
          order = [[Location, "name", sortOrder]];
          break;
        default:
          order = [["start_date", "ASC"]];
      }
    }

    const events = await Event.findAll({
      where: whereCondition,
      include: [
        { model: Contractor, attributes: ["id", "company_name"] },
        { model: Location, attributes: ["id", "name"] },
      ],
      order,
    });

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findOne({
      where: { id },
      include: [
        { model: Contractor, attributes: ["id", "company_name"] },
        { model: Location, attributes: ["id", "name"] },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Delete the event
    await event.destroy();

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Event
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_name, contractor_id, location_id, start_date, end_date } =
      req.body;

    // Check if the event exists
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Update event details
    await event.update({
      event_name,
      contractor_id,
      location_id,
      start_date,
      end_date,
    });

    // Fetch updated event with related models
    const updatedEvent = await Event.findByPk(id, {
      include: [
        { model: Contractor, attributes: ["id", "company_name"] },
        { model: Location, attributes: ["id", "name"] },
      ],
    });

    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
