const { Op } = require("sequelize");

const {
  Contractor,
  Event,
  Location,
  EventLocationContractor,
  EventLocation,
} = require("../models");
const sequelize = require("../config/database");
const moment = require("moment");
// Create Event
// const createEvent = async (req, res) => {
//   try {
//     const { event_name, contractor_id, location_id, start_date, end_date } =
//       req.body;

//     if (
//       !event_name ||
//       !contractor_id ||
//       !location_id ||
//       !start_date ||
//       !end_date
//     ) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     console.log(req.body, "????//////");
//     const newEvent = await Event.create({
//       event_name,
//       contractor_id,
//       location_id,
//       start_date,
//       end_date,
//     });

//     // Fetch event with associated location and contractor details
//     const createdEvent = await Event.findOne({
//       where: { id: newEvent.id },
//       include: [
//         {
//           model: Location,
//           //   as: "location",
//           attributes: ["id", "name"], // Fetch location name
//         },
//         {
//           model: Contractor,
//           //   as: "contractor",
//           attributes: ["id", "company_name"], // Fetch contractor name
//         },
//       ],
//     });

//     res.status(201).json(createdEvent);
//   } catch (error) {
//     console.log(error, "========");
//     res.status(500).json({ error: error.message });
//   }
// };

const createEvent = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      event_name,
      project_code,
      project_comments,
      start_date,
      end_date,
      locations,
    } = req.body;

    if (
      !event_name ||
      !project_code ||
      !project_comments ||
      !start_date ||
      !end_date ||
      !Array.isArray(locations)
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Create Event
    const event = await Event.create(
      { event_name, project_code, project_comments, start_date, end_date },
      { transaction: t },
    );

    // 2. Create EventLocations and nested Contractors
    for (const loc of locations) {
      const { location_id, contractors } = loc;

      const eventLocation = await EventLocation.create(
        {
          event_id: event.id,
          location_id,
        },
        { transaction: t },
      );

      const contractorRecords = contractors.map((contractor) => ({
        event_location_id: eventLocation.id,
        contractor_id: contractor.contractor_id,
        start_time: contractor.start_time,
        end_time: contractor.end_time,
      }));

      await EventLocationContractor.bulkCreate(contractorRecords, {
        transaction: t,
      });
    }

    // 3. Commit transaction
    await t.commit();

    // 4. Fetch full nested structure after commit
    const fullEvent = await Event.findOne({
      where: { id: event.id },
      include: [
        {
          model: EventLocation,
          include: [
            {
              model: Location,
              attributes: ["id", "name"],
            },
            {
              model: EventLocationContractor,
              include: [
                {
                  model: Contractor,
                  attributes: ["id", "company_name"],
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(201).json(fullEvent);
  } catch (error) {
    console.error("createEvent error:", error);

    // Rollback transaction on error
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};

// Get All Events
const getAllEvents = async (req, res) => {
  try {
    const {
      search,
      sortField,
      sortOrder,
      tab,
      eventFilter,
      locationFilter,
      contractorsFilter,
    } = req.query;

    let whereCondition = {};
    if (search) {
      whereCondition = {
        event_name: {
          [Op.iLike]: `%${search}%`,
        },
      };
    }

    if (eventFilter) {
      whereCondition.id = eventFilter;
    }

    // Tab-based filtering (current, past, future)
    const today = moment().startOf("day");

    console.log(today, "++++++Today==");

    if (tab === "Current") {
      whereCondition.start_date = { [Op.lte]: today.toDate() };
      whereCondition.end_date = { [Op.gte]: today.toDate() };
    } else if (tab === "Past") {
      whereCondition.end_date = { [Op.lt]: today.toDate() };
    } else if (tab === "Future") {
      whereCondition.start_date = { [Op.gt]: today.toDate() };
    }

    // Default sorting
    let order = [["start_date", "ASC"]];

    // Sorting logic (note: nested sorting is complex; limit to top-level fields)
    if (sortField && sortOrder) {
      const validFields = ["event_name", "start_date", "end_date"];
      if (validFields.includes(sortField)) {
        order = [[sortField, sortOrder]];
      }
    }

    console.log("Order----:", order);

    const rawEvents = await Event.findAll({
      where: whereCondition,
      include: [
        {
          model: EventLocation,
          required: !!(locationFilter || contractorsFilter),
          where: locationFilter ? { location_id: locationFilter } : undefined,
          include: [
            {
              model: Location,
              attributes: ["id", "name"],
            },
            {
              model: EventLocationContractor,
              required: !!contractorsFilter,
              where: contractorsFilter
                ? { contractor_id: contractorsFilter }
                : undefined,
              include: [
                {
                  model: Contractor,
                  attributes: ["id", "company_name"],
                },
              ],
              attributes: ["id", "start_time", "end_time", "contractor_id"],
            },
          ],
        },
      ],
      order,
    });

    // Add status: current/past/future to each event
    const events = rawEvents.map((event) => {
      const start = moment(event.start_date);
      const end = moment(event.end_date);

      let status = "Future";
      if (today.isBetween(start, end, undefined, "[]")) {
        status = "Current";
      } else if (today.isAfter(end)) {
        status = "Past";
      }

      return {
        ...event.toJSON(),
        status,
      };
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: error.message });
  }
};

const getEventList = async (req, res) => {
  try {
    const events = await Event.findAll({
      attributes: ["id", "event_name"],
      order: [["event_name", "ASC"]], // Optional: sort alphabetically
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching event list:", error);
    res.status(500).json({ error: error.message });
  }
};

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findOne({
      where: { id },
      include: [
        {
          model: EventLocation,
          include: [
            {
              model: Location,
              attributes: ["id", "name"],
            },
            {
              model: EventLocationContractor,
              include: [
                {
                  model: Contractor,
                  attributes: ["id", "company_name"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    // 1. Check if the event exists
    const event = await Event.findByPk(id, { transaction: t });
    if (!event) {
      await t.rollback();
      return res.status(404).json({ error: "Event not found" });
    }

    // 2. Get all associated EventLocation IDs
    const eventLocations = await EventLocation.findAll({
      where: { event_id: id },
      transaction: t,
    });
    const locationIds = eventLocations.map((loc) => loc.id);

    // 3. Delete EventLocationContractors
    if (locationIds.length > 0) {
      await EventLocationContractor.destroy({
        where: { event_location_id: locationIds },
        transaction: t,
      });

      // 4. Delete EventLocations
      await EventLocation.destroy({
        where: { id: locationIds },
        transaction: t,
      });
    }

    // 5. Delete the Event
    await event.destroy({ transaction: t });

    // 6. Commit transaction
    await t.commit();

    res
      .status(200)
      .json({ message: "Event and related data deleted successfully" });
  } catch (error) {
    await t.rollback();
    console.error("deleteEvent error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update Event
const updateEvent = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      event_name,
      project_code,
      project_comments,
      start_date,
      end_date,
      locations,
    } = req.body;

    if (
      !event_name ||
      !start_date ||
      !end_date ||
      !project_code ||
      !project_comments ||
      !Array.isArray(locations)
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Check if event exists
    const event = await Event.findByPk(id, { transaction: t });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // 2. Update Event basic info
    await event.update(
      { event_name, project_code, project_comments, start_date, end_date },
      { transaction: t },
    );

    // 3. Delete old EventLocations and Contractors
    const oldEventLocations = await EventLocation.findAll({
      where: { event_id: id },
      transaction: t,
    });

    const oldLocationIds = oldEventLocations.map((loc) => loc.id);

    if (oldLocationIds.length) {
      await EventLocationContractor.destroy({
        where: { event_location_id: oldLocationIds },
        transaction: t,
      });

      await EventLocation.destroy({
        where: { id: oldLocationIds },
        transaction: t,
      });
    }

    // 4. Recreate EventLocations and Contractors from new payload
    for (const loc of locations) {
      const { location_id, contractors } = loc;

      const eventLocation = await EventLocation.create(
        {
          event_id: event.id,
          location_id,
        },
        { transaction: t },
      );

      const contractorRecords = contractors.map((contractor) => ({
        event_location_id: eventLocation.id,
        contractor_id: contractor.contractor_id,
        start_time: contractor.start_time,
        end_time: contractor.end_time,
      }));

      await EventLocationContractor.bulkCreate(contractorRecords, {
        transaction: t,
      });
    }

    // 5. Commit transaction
    await t.commit();

    // 6. Fetch full updated structure after commit
    const updatedEvent = await Event.findOne({
      where: { id: event.id },
      include: [
        {
          model: EventLocation,
          include: [
            {
              model: Location,
              attributes: ["id", "name"],
            },
            {
              model: EventLocationContractor,
              include: [
                {
                  model: Contractor,
                  attributes: ["id", "company_name"],
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("updateEvent error:", error);
    await t.rollback();
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventList,
};
