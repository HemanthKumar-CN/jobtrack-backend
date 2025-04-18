const path = require("path");
const Location = require("../models/Location");
const { Op, Sequelize } = require("sequelize");
const Schedule = require("../models/Schedule");
const Event = require("../models/Events");
const Employee = require("../models/Employee");
const Contractor = require("../models/Contractor");
const moment = require("moment");

const createLocation = async (req, res) => {
  try {
    const { name, address_1, address_2, city, state, postal_code } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null; // Store relative path

    const location = await Location.create({
      name,
      address_1,
      address_2,
      city,
      state,
      postal_code,
      image_url,
    });

    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLocations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortField = "id",
      sortOrder = "ASC",
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search
      ? {
          name: { [Op.iLike]: `%${search}%` }, // Case-insensitive search
        }
      : {};

    // Allow only specific fields to sort by
    const allowedSortFields = ["name", "city", "state", "id"];
    const order = allowedSortFields.includes(sortField)
      ? [[sortField, sortOrder.toUpperCase()]]
      : [["id", "ASC"]]; // default if invalid sortField

    const locations = await Location.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
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
    const { name, address_1, address_2, city, state, postal_code } = req.body;

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
    // Get current week's start and end date (Monday - Sunday)
    const startOfWeek = moment().startOf("week").format("YYYY-MM-DD");
    const endOfWeek = moment().endOf("week").format("YYYY-MM-DD");

    // Count schedules where is_deleted is false and status is "scheduled"
    const totalSchedules = await Schedule.count({
      where: {
        is_deleted: false,
        status: "scheduled",
      },
    });

    // Count total employees
    const totalEmployees = await Employee.count();

    // Count total locations
    const totalLocations = await Location.count();

    // Count total contractors
    const totalContractors = await Contractor.count();

    // Get schedules for the current week
    const schedules = await Schedule.findAll({
      attributes: [
        "employee_id",
        "start_date",
        "end_date",
        "start_time",
        "end_time",
      ],
      where: {
        is_deleted: false,
        status: "scheduled",
        start_date: { [Op.lte]: endOfWeek },
        end_date: { [Op.gte]: startOfWeek },
      },
      raw: true,
    });

    // Calculate total hours for each employee
    const employeeHours = {};

    console.log(schedules, ";;lllllllllll", startOfWeek, endOfWeek);

    schedules.forEach((schedule) => {
      const { employee_id, start_date, end_date, start_time, end_time } =
        schedule;

      // Parse dates and times
      const startDate = moment(start_date);
      const endDate = moment(end_date);
      const startTime = moment(start_time, "HH:mm:ss");
      const endTime = moment(end_time, "HH:mm:ss");

      // Calculate days including start and end
      const numDays = endDate.diff(startDate, "days") + 1;

      // Calculate hours per day
      const hoursPerDay = endTime.diff(startTime, "hours", true); // true ensures decimals

      // Total hours for this schedule
      const totalHours = numDays * hoursPerDay;

      // Add to employee total
      if (!employeeHours[employee_id]) {
        employeeHours[employee_id] = 0;
      }
      employeeHours[employee_id] += totalHours;
    });

    console.log(employeeHours, "++++++++++++++++++++");

    // Get employees working more than 40 hours
    const overworkedEmployees = Object.entries(employeeHours)
      .filter(([_, hours]) => hours > 40)
      .map(([employee_id, total_hours]) => ({
        employee_id: parseInt(employee_id),
        total_hours: total_hours.toFixed(2),
      }));

    return res.json({
      success: true,
      totalSchedules,
      overworkedEmployees,
      totalContractors,
      totalEmployees,
      totalLocations,
    });
  } catch (error) {
    console.error("Error fetching total schedules:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
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
