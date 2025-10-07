const { Op } = require("sequelize");

const {
  Contractor,
  Event,
  Location,
  EventLocationContractor,
  EventLocation,
  ContractorClass,
  Classification,
} = require("../models");
const sequelize = require("../config/database");
const moment = require("moment");
// Create Event

// const createEvent = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const {
//       event_name,
//       project_code,
//       project_comments,
//       start_date,
//       end_date,
//       locations,
//     } = req.body;

//     if (
//       !event_name ||
//       !project_code ||
//       !project_comments ||
//       !start_date ||
//       !end_date ||
//       !Array.isArray(locations)
//     ) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // 1. Create Event
//     const event = await Event.create(
//       { event_name, project_code, project_comments, start_date, end_date },
//       { transaction: t },
//     );

//     // 2. Create EventLocations and nested Contractors
//     for (const loc of locations) {
//       const { location_id, contractors } = loc;

//       const eventLocation = await EventLocation.create(
//         {
//           event_id: event.id,
//           location_id,
//         },
//         { transaction: t },
//       );

//       const contractorRecords = contractors.map((contractor) => ({
//         event_location_id: eventLocation.id,
//         contractor_id: contractor.contractor_id,
//         start_time: contractor.start_time,
//         end_time: contractor.end_time,
//       }));

//       await EventLocationContractor.bulkCreate(contractorRecords, {
//         transaction: t,
//       });
//     }

//     // 3. Commit transaction
//     await t.commit();

//     // 4. Fetch full nested structure after commit
//     const fullEvent = await Event.findOne({
//       where: { id: event.id },
//       include: [
//         {
//           model: EventLocation,
//           include: [
//             {
//               model: Location,
//               attributes: ["id", "name"],
//             },
//             {
//               model: EventLocationContractor,
//               include: [
//                 {
//                   model: Contractor,
//                   attributes: ["id", "company_name"],
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     });

//     res.status(201).json(fullEvent);
//   } catch (error) {
//     console.error("createEvent error:", error);

//     // Rollback transaction on error
//     await t.rollback();
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
      event_type,
    } = req.body;

    if (!event_name || !start_date || !end_date || !Array.isArray(locations)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Create the Event
    const event = await Event.create(
      {
        event_name,
        project_code,
        project_comments,
        start_date: moment(start_date).toDate(),
        end_date: moment(end_date).toDate(),
        event_type,
      },
      { transaction: t },
    );

    // 2️⃣ Loop through locations
    for (const loc of locations) {
      const { location_id, contractors } = loc;

      const eventLocation = await EventLocation.create(
        {
          event_id: event.id,
          location_id,
        },
        { transaction: t },
      );

      // 3️⃣ Loop through contractors
      for (const contractor of contractors) {
        const assignment = await EventLocationContractor.create(
          {
            event_location_id: eventLocation.id,
            contractor_id: contractor.value,
            steward_id: contractor.steward_id || null,
          },
          { transaction: t },
        );

        // Helper to insert class arrays
        const insertClasses = async (classArray, classType) => {
          if (!Array.isArray(classArray)) return;
          for (const cls of classArray) {
            await ContractorClass.create(
              {
                assignment_id: assignment.id,
                classification_id: cls.value,
                class_type: classType,
                start_time: cls.startTime || null,
                end_time: cls.endTime || null,
                need_number: cls.needNumber || null,
              },
              { transaction: t },
            );
          }
        };

        // 4️⃣ Insert all class types
        await insertClasses(contractor.classes, "regular");
        await insertClasses(contractor.inClasses, "in");
        await insertClasses(contractor.outClasses, "out");
      }
    }

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

    return res.status(201).json(fullEvent);
  } catch (error) {
    await t.rollback();
    console.error("Create Event Error:", error);
    return res.status(500).json({ error: "Internal server error" });
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
    let order = [["start_date", "DESC"]];

    // Sorting logic (note: nested sorting is complex; limit to top-level fields)
    if (sortField && sortOrder) {
      const validFields = ["event_name", "start_date", "end_date"];
      if (validFields.includes(sortField)) {
        order = [[sortField, sortOrder]];
      }
    }

    console.log("Order----:", order);
    console.log("whereCondition:", whereCondition);

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
              attributes: ["id", "contractor_id"],
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

      console.log(
        "Event dates: ++++++Today==",
        event.start_date,
        event.end_date,
        whereCondition,
      );
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

    // Step 1: fetch the event itself
    const event = await Event.findOne({
      where: { id },
      attributes: [
        "id",
        "event_name",
        "project_code",
        "project_comments",
        "start_date",
        "end_date",
        "event_type",
      ],
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Step 2: fetch event locations + Location
    const eventLocations = await EventLocation.findAll({
      where: { event_id: id },
      include: [
        {
          model: Location,
          attributes: ["id", "name"],
        },
      ],
      attributes: ["id", "event_id", "location_id"],
    });

    // Step 3: enrich each location with contractors
    const enrichedEventLocations = await Promise.all(
      eventLocations.map(async (el) => {
        const contractors = await EventLocationContractor.findAll({
          where: { event_location_id: el.id },
          include: [
            {
              model: Contractor,
              attributes: ["id", "company_name"],
            },
          ],
          attributes: [
            "id",
            "event_location_id",
            "contractor_id",
            "steward_id",
          ],
        });

        // Step 4: enrich each contractor with classes + classification
        const enrichedContractors = await Promise.all(
          contractors.map(async (c) => {
            const classes = await ContractorClass.findAll({
              where: { assignment_id: c.id },
              attributes: [
                "id",
                "assignment_id",
                "classification_id", // <- keep explicit
                "class_type",
                "start_time",
                "end_time",
                "need_number",
              ],
              include: [
                {
                  model: Classification,
                  as: "classification",
                  attributes: ["id", "abbreviation", "description"],
                },
              ],
            });

            return {
              ...c.toJSON(),
              classes,
            };
          }),
        );

        return {
          ...el.toJSON(),
          contractors: enrichedContractors,
        };
      }),
    );

    // Final output
    const result = {
      ...event.toJSON(),
      locations: enrichedEventLocations,
    };

    res.status(200).json(result);
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
// const updateEvent = async (req, res) => {
//   const t = await sequelize.transaction();

//   try {
//     const { id } = req.params;
//     const {
//       event_name,
//       project_code,
//       project_comments,
//       start_date,
//       end_date,
//       locations,
//     } = req.body;

//     if (
//       !event_name ||
//       !start_date ||
//       !end_date ||
//       !project_code ||
//       !project_comments ||
//       !Array.isArray(locations)
//     ) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // 1. Check if event exists
//     const event = await Event.findByPk(id, { transaction: t });
//     if (!event) {
//       return res.status(404).json({ error: "Event not found" });
//     }

//     // 2. Update Event basic info
//     await event.update(
//       { event_name, project_code, project_comments, start_date, end_date },
//       { transaction: t },
//     );

//     // 3. Delete old EventLocations and Contractors
//     const oldEventLocations = await EventLocation.findAll({
//       where: { event_id: id },
//       transaction: t,
//     });

//     const oldLocationIds = oldEventLocations.map((loc) => loc.id);

//     if (oldLocationIds.length) {
//       await EventLocationContractor.destroy({
//         where: { event_location_id: oldLocationIds },
//         transaction: t,
//       });

//       await EventLocation.destroy({
//         where: { id: oldLocationIds },
//         transaction: t,
//       });
//     }

//     // 4. Recreate EventLocations and Contractors from new payload
//     for (const loc of locations) {
//       const { location_id, contractors } = loc;

//       const eventLocation = await EventLocation.create(
//         {
//           event_id: event.id,
//           location_id,
//         },
//         { transaction: t },
//       );

//       const contractorRecords = contractors.map((contractor) => ({
//         event_location_id: eventLocation.id,
//         contractor_id: contractor.contractor_id,
//         start_time: contractor.start_time,
//         end_time: contractor.end_time,
//       }));

//       await EventLocationContractor.bulkCreate(contractorRecords, {
//         transaction: t,
//       });
//     }

//     // 5. Commit transaction
//     await t.commit();

//     // 6. Fetch full updated structure after commit
//     const updatedEvent = await Event.findOne({
//       where: { id: event.id },
//       include: [
//         {
//           model: EventLocation,
//           include: [
//             {
//               model: Location,
//               attributes: ["id", "name"],
//             },
//             {
//               model: EventLocationContractor,
//               include: [
//                 {
//                   model: Contractor,
//                   attributes: ["id", "company_name"],
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     });

//     res.status(200).json(updatedEvent);
//   } catch (error) {
//     console.error("updateEvent error:", error);
//     await t.rollback();
//     res.status(500).json({ error: error.message });
//   }
// };

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
      event_type,
    } = req.body;

    // 🔎 Validate required fields
    if (!event_name || !start_date || !end_date || !Array.isArray(locations)) {
      await t.rollback();
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Update Event basic info
    const [updated] = await Event.update(
      {
        event_name,
        project_code,
        project_comments,
        start_date,
        end_date,
        event_type,
      },
      { where: { id }, transaction: t },
    );

    if (!updated) {
      await t.rollback();
      return res.status(404).json({ error: "Event not found" });
    }

    // 2️⃣ Fetch existing event locations (with contractors + classes)
    const existingLocations = await EventLocation.findAll({
      where: { event_id: id },
      include: {
        model: EventLocationContractor,
        include: [
          {
            model: ContractorClass,
            as: "classes", // ✅ must match alias
          },
        ],
      },
      transaction: t,
    });

    const locationMap = new Map(
      existingLocations.map((l) => [l.location_id, l]),
    );
    const seenLocationIds = new Set();

    // 3️⃣ Process each location in payload
    for (const loc of locations) {
      let eventLocation = locationMap.get(loc.location_id);

      if (!eventLocation) {
        eventLocation = await EventLocation.create(
          { event_id: id, location_id: loc.location_id },
          { transaction: t },
        );
      }
      seenLocationIds.add(eventLocation.location_id);

      // Contractors
      const existingContractors = eventLocation.EventLocationContractors || [];
      const contractorMap = new Map(
        existingContractors.map((c) => [c.contractor_id, c]),
      );
      const seenContractorIds = new Set();

      for (const contractor of loc.contractors || []) {
        let eventContractor = contractorMap.get(contractor.value);

        console.log("Processing contractor:", contractor);

        if (!eventContractor) {
          eventContractor = await EventLocationContractor.create(
            {
              event_location_id: eventLocation.id,
              contractor_id: contractor.value,
              steward_id: contractor.steward_id || null,
            },
            { transaction: t },
          );
        } else {
          // Update steward_id if changed
          if (eventContractor.steward_id !== (contractor.steward_id || null)) {
            await eventContractor.update(
              { steward_id: contractor.steward_id || null },
              { transaction: t },
            );
          }
        }

        seenContractorIds.add(eventContractor.contractor_id);

        // Classes (normal, inClasses, outClasses)
        const classTypes = [
          { arr: contractor.classes || [], type: "regular" },
          { arr: contractor.inClasses || [], type: "in" },
          { arr: contractor.outClasses || [], type: "out" },
        ];

        const existingClasses = eventContractor.classes || [];
        const classMap = new Map(
          existingClasses.map((cl) => [
            cl.classification_id + "_" + cl.class_type,
            cl,
          ]),
        );
        const seenClassIds = new Set();

        for (const { arr, type } of classTypes) {
          for (const cl of arr) {
            const key = cl.value + "_" + type;
            let eventClass = classMap.get(key);

            if (!eventClass) {
              await ContractorClass.create(
                {
                  assignment_id: eventContractor.id,
                  classification_id: cl.value,
                  class_type: type,
                  start_time: cl.startTime || null,
                  end_time: cl.endTime || null,
                  need_number: cl.needNumber || null,
                },
                { transaction: t },
              );
            } else {
              await eventClass.update(
                {
                  start_time: cl.startTime || null,
                  end_time: cl.endTime || null,
                  need_number: cl.needNumber || null,
                },
                { transaction: t },
              );
            }
            seenClassIds.add(key);
          }
        }

        // ❌ Delete removed classes
        for (const exClass of existingClasses) {
          const key = exClass.classification_id + "_" + exClass.class_type;
          if (!seenClassIds.has(key)) {
            await exClass.destroy({ transaction: t });
          }
        }
      }

      // ❌ Delete removed contractors
      for (const exContractor of existingContractors) {
        if (!seenContractorIds.has(exContractor.contractor_id)) {
          await exContractor.destroy({ transaction: t });
        }
      }
    }

    // ❌ Delete removed locations
    for (const exLoc of existingLocations) {
      if (!seenLocationIds.has(exLoc.location_id)) {
        await exLoc.destroy({ transaction: t });
      }
    }

    await t.commit();
    return res
      .status(200)
      .json({ success: true, message: "Event updated successfully" });
  } catch (error) {
    await t.rollback();
    console.error("Error updating event:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

const getActiveEventLocations = async (req, res) => {
  try {
    const { date } = req.params;

    // ensure the date is valid
    if (!date || isNaN(new Date(date))) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const activeLocations = await Location.findAll({
      where: { status: "active" },
      attributes: ["id", "name"],
      include: [
        {
          model: EventLocation,
          as: "eventLocations",
          required: true,
          include: [
            {
              model: Event,
              where: {
                start_date: { [Op.lte]: date }, // start_date <= date
                end_date: { [Op.gte]: date }, // end_date >= date
              },
              attributes: ["id", "event_name", "start_date", "end_date"],
            },
          ],
          attributes: ["id", "event_id"],
        },
      ],
    });

    return res.json(activeLocations);
  } catch (error) {
    console.error("Error fetching active event locations:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventList,
  getActiveEventLocations,
};
