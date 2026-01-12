const path = require("path");
const {
  Location,
  Schedule,
  Event,
  Employee,
  Contractor,
  EventLocation,
  EventLocationContractor,
  ContractorClass,
  Classification,
  User,
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const moment = require("moment");
const generateRandomColor = require("../utils/generateRandomColor");

const createLocation = async (req, res) => {
  try {
    const { name, address_1, address_2, city, state, postal_code, status } =
      req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null; // Store relative path

    // Auto-generate a unique non-grey/black/white color code
    const colour_code = generateRandomColor();

    const location = await Location.create({
      name,
      address_1,
      address_2,
      city,
      state,
      status,
      postal_code,
      image_url,
      colour_code,
    });

    res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ error: error });
  }
};

const getLocations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = "",
      sortField = "id",
      sortOrder = "ASC",
      status = "",
      location = "",
      address = "",
      city = "",
      state = "",
      zip = "",
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? {
          name: { [Op.iLike]: `%${search}%` }, // Case-insensitive search
        }
      : {};

    if (status && ["active", "inactive"].includes(status)) {
      whereClause.status = status;
    }
    if (location) {
      whereClause.name = { [Op.iLike]: `%${location}%` };
    }
    if (address) {
      whereClause[Op.or] = [
        { address_1: { [Op.iLike]: `%${address}%` } },
        { address_2: { [Op.iLike]: `%${address}%` } },
      ];
    }
    if (city) {
      whereClause.city = { [Op.iLike]: `%${city}%` };
    }
    if (state) {
      whereClause.state = { [Op.iLike]: `%${state}%` };
    }
    if (zip) {
      whereClause.postal_code = { [Op.iLike]: `%${zip}%` };
    }

    // Allow only specific fields to sort by
    const allowedSortFields = ["name", "city", "state", "id"];
    const order = allowedSortFields.includes(sortField)
      ? [[sortField, sortOrder.toUpperCase()]]
      : [["id", "ASC"]]; // default if invalid sortField

    const locations = await Location.findAll({
      where: whereClause,
      // limit: parseInt(limit),
      // offset: parseInt(offset),
      order,
    });

    const totalCount = await Location.count({ where: whereClause });

    res.status(200).json({
      locations,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.findAll({
      order: [["id", "ASC"]], // Keep ordering if needed
      attributes: ["id", "name"], // Fetch only id & name
    });

    res.status(200).json({ locations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLocationById = async (req, res) => {
  try {
    const { id } = req.params; // Extract the ID from the request parameters

    const location = await Location.findByPk(id); // Find location by primary key (ID)

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address_1, address_2, city, state, postal_code, status } =
      req.body;

    const location = await Location.findByPk(id);
    if (!location) return res.status(404).json({ error: "Location not found" });

    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : location.image_url;

    location.name = name;
    location.address_1 = address_1;
    location.address_2 = address_2;
    location.city = city;
    location.state = state;
    location.postal_code = postal_code;
    location.image_url = image_url;
    location.status = status;

    await location.save();
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id);
    if (!location) return res.status(404).json({ error: "Location not found" });

    await location.destroy();
    res.status(200).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const dashboardLocation = async (req, res) => {
  try {
    // Fetch locations with employee count
    const locationsWithEmployeeCount = await Schedule.findAll({
      attributes: [
        [Sequelize.col("Event.location_id"), "location_id"],
        [
          Sequelize.fn(
            "COUNT",
            Sequelize.fn("DISTINCT", Sequelize.col("employee_id")),
          ),
          "total_employees",
        ],
      ],
      include: [
        {
          model: Event,
          attributes: [],
        },
      ],
      group: ["Event.location_id"],
      raw: true,
    });

    // Fetch location details
    const locations = await Location.findAll({
      attributes: [
        "id",
        "name",
        "address_1",
        "address_2",
        "city",
        "state",
        "postal_code",
      ],
      raw: true,
    });

    // Merge employee count with location data
    const result = locations.map((location) => {
      const employeeData = locationsWithEmployeeCount.find(
        (e) => e.location_id === location.id,
      );
      return {
        ...location,
        total_employees: employeeData ? employeeData.total_employees : 0,
      };
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching locations with employee count:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};

const dashboardItems = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Date parameter is required",
      });
    }

    // Step 1: Get all events that are active on the given date
    const events = await Event.findAll({
      where: {
        start_date: { [Op.lte]: date },
        end_date: { [Op.gte]: date },
      },
      order: [["id", "ASC"]],
    });

    if (events.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No events found for the specified date",
        data: [],
        pending_schedules: [],
        summary: {
          total_events: 0,
          total_locations: 0,
          total_confirmed: 0,
          total_pending: 0,
          total_declined: 0,
        },
      });
    }

    const eventIds = events.map((event) => event.id);

    // Step 2: Get all event locations for these events
    const eventLocations = await EventLocation.findAll({
      where: {
        event_id: { [Op.in]: eventIds },
      },
      include: [
        {
          model: Location,
          attributes: ["id", "name", "colour_code"],
        },
      ],
    });

    const eventLocationIds = eventLocations.map((el) => el.id);

    // Get unique location count
    const uniqueLocations = new Set(eventLocations.map((el) => el.Location.id));

    // Step 3: Get all event location contractors
    const eventLocationContractors = await EventLocationContractor.findAll({
      where: {
        event_location_id: { [Op.in]: eventLocationIds },
      },
      include: [
        {
          model: Contractor,
          attributes: ["id", "first_name", "last_name", "company_name"],
        },
      ],
    });

    const eventLocationContractorIds = eventLocationContractors.map(
      (elc) => elc.id,
    );

    // Step 4: Get all contractor classes
    const contractorClasses = await ContractorClass.findAll({
      where: {
        assignment_id: { [Op.in]: eventLocationContractorIds },
      },
      include: [
        {
          model: Classification,
          as: "classification",
          attributes: ["id", "abbreviation", "description"],
        },
      ],
    });

    const contractorClassIds = contractorClasses.map((cc) => cc.id);

    // Step 5: Get schedule counts for each contractor class for the given date
    const schedules = await Schedule.findAll({
      where: {
        contractor_class_id: { [Op.in]: contractorClassIds },
        is_deleted: false,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("Schedule.start_time")),
            date,
          ),
        ],
      },
      attributes: [
        "contractor_class_id",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "schedule_count"],
      ],
      group: ["contractor_class_id"],
    });

    // Step 6: Get pending schedules with employee details
    const pendingSchedules = await Schedule.findAll({
      where: {
        contractor_class_id: { [Op.in]: contractorClassIds },
        is_deleted: false,
        status: "pending",
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("Schedule.start_time")),
            date,
          ),
        ],
      },
      include: [
        {
          model: Employee,
          attributes: ["id", "user_id"],
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name"],
            },
          ],
        },
        {
          model: Event,
          attributes: ["event_name"],
        },
        {
          model: ContractorClass,
          attributes: ["class_type"],
          include: [
            {
              model: Classification,
              as: "classification",
              attributes: ["abbreviation"],
            },
          ],
        },
        {
          model: EventLocationContractor,
          attributes: ["contractor_id"],
          include: [
            {
              model: Contractor,
              attributes: ["company_name"],
            },
            {
              model: EventLocation,
              attributes: ["location_id"],
              include: [
                {
                  model: Location,
                  attributes: ["name"],
                },
              ],
            },
          ],
        },
      ],
    });

    // Step 7: Get schedule status summary for the date
    const statusSummary = await Schedule.findAll({
      where: {
        contractor_class_id: { [Op.in]: contractorClassIds },
        is_deleted: false,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("Schedule.start_time")),
            date,
          ),
        ],
      },
      attributes: [
        "status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: ["status"],
    });

    // Step 8: Create lookup maps
    const eventMap = {};
    events.forEach((event) => {
      eventMap[event.id] = event;
    });

    const eventLocationMap = {};
    eventLocations.forEach((el) => {
      if (!eventLocationMap[el.event_id]) {
        eventLocationMap[el.event_id] = [];
      }
      eventLocationMap[el.event_id].push(el);
    });

    const eventLocationContractorMap = {};
    eventLocationContractors.forEach((elc) => {
      if (!eventLocationContractorMap[elc.event_location_id]) {
        eventLocationContractorMap[elc.event_location_id] = [];
      }
      eventLocationContractorMap[elc.event_location_id].push(elc);
    });

    const contractorClassMap = {};
    contractorClasses.forEach((cc) => {
      if (!contractorClassMap[cc.assignment_id]) {
        contractorClassMap[cc.assignment_id] = [];
      }
      contractorClassMap[cc.assignment_id].push(cc);
    });

    const scheduleCountMap = {};
    schedules.forEach((sc) => {
      const classId = sc.getDataValue("contractor_class_id");
      const count = parseInt(sc.getDataValue("schedule_count"));
      scheduleCountMap[classId] = count;
    });

    // Process status summary
    const summary = {
      total_events: events.length,
      total_locations: uniqueLocations.size,
      total_confirmed: 0,
      total_pending: 0,
      total_declined: 0,
    };

    statusSummary.forEach((status) => {
      const statusValue = status.getDataValue("status");
      const count = parseInt(status.getDataValue("count"));
      if (statusValue === "confirmed") summary.total_confirmed = count;
      if (statusValue === "pending") summary.total_pending = count;
      if (statusValue === "declined") summary.total_declined = count;
    });

    // Step 9: Format pending schedules
    const formattedPendingSchedules = pendingSchedules.map((schedule) => ({
      schedule_id: schedule.id,
      employee_name: schedule.Employee?.User
        ? `${schedule.Employee.User.first_name} ${schedule.Employee.User.last_name}`
        : "N/A",
      event_name: schedule.Event?.event_name || "N/A",
      location_name:
        schedule.EventLocationContractor?.EventLocation?.Location?.name ||
        "N/A",
      contractor_company:
        schedule.EventLocationContractor?.Contractor?.company_name || "N/A",
      classification:
        schedule.ContractorClass?.classification?.abbreviation || "N/A",
      start_time: schedule.start_time,
    }));

    // Step 10: Build the result array with all combinations
    const result = [];

    events.forEach((event) => {
      const eventLocationsList = eventLocationMap[event.id] || [];

      eventLocationsList.forEach((eventLocation) => {
        const eventLocationContractorsList =
          eventLocationContractorMap[eventLocation.id] || [];

        eventLocationContractorsList.forEach((eventLocationContractor) => {
          const contractorClassesList =
            contractorClassMap[eventLocationContractor.id] || [];

          contractorClassesList.forEach((contractorClass) => {
            const scheduleCount = scheduleCountMap[contractorClass.id] || 0;

            result.push({
              event_id: event.id,
              event_name: event.event_name,
              event_type: event.event_type,
              project_code: event.project_code,
              location_id: eventLocation.Location.id,
              location_name: eventLocation.Location.name,
              location_colour_code: eventLocation.Location.colour_code,
              event_location_contractor_id: eventLocationContractor.id,
              contractor_id: eventLocationContractor.Contractor.id,
              contractor_name: `${eventLocationContractor.Contractor.first_name} ${eventLocationContractor.Contractor.last_name}`,
              contractor_company:
                eventLocationContractor.Contractor.company_name,
              contractor_class_id: contractorClass.id,
              classification_id: contractorClass.classification.id,
              classification_abbreviation:
                contractorClass.classification.abbreviation,
              classification_description:
                contractorClass.classification.description,
              class_type: contractorClass.class_type,
              need_number: contractorClass.need_number,
              schedule_count: scheduleCount,
            });
          });
        });
      });
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard items retrieved successfully",
      data: result,
      pending_schedules: formattedPendingSchedules,
      summary: summary,
      total_combinations: result.length,
      date: date,
    });
  } catch (error) {
    console.error("Error fetching dashboard items:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
  getLocationById,
  getAllLocations,
  dashboardLocation,
  dashboardItems,
};
