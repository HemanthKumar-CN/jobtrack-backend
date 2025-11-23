const {
  Employee,
  Location,
  User,
  Timesheet,
  Schedule,
  Event,
  ContractorClass,
  Classification,
  EventLocationContractor,
  EventLocation,
  Contractor,
  AdminConfig,
} = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");

// 1) Search employees by name, ges, or four
exports.searchEmployees = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search term is required",
      });
    }

    console.log(`Searching employees with term: "${search}"`);

    // Find matching employees based on search term
    const matchingEmployees = await Employee.findAll({
      include: [
        {
          model: User,
          attributes: ["first_name", "last_name"],
          required: false,
        },
      ],
      where: {
        [Op.or]: [
          {
            ges: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            four: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            "$User.first_name$": {
              [Op.like]: `%${search}%`,
            },
          },
          {
            "$User.last_name$": {
              [Op.like]: `%${search}%`,
            },
          },
        ],
      },
      attributes: ["id", "four", "ges"],
    });

    if (matchingEmployees.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No employees found matching the search term",
        data: [],
        total_records: 0,
      });
    }

    // Format the response
    const formattedEmployees = matchingEmployees.map((emp) => ({
      id: emp.id,
      name: emp.User
        ? `${emp.User.first_name} ${emp.User.last_name}`
        : "Unknown",
      four: emp.four,
      ges: emp.ges,
    }));

    return res.status(200).json({
      success: true,
      message: `Found ${formattedEmployees.length} matching employees`,
      data: formattedEmployees,
      total_records: formattedEmployees.length,
    });
  } catch (error) {
    console.error("Error searching employees:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 2) Get timesheet data for a specific employee by ID and date range
exports.getEmployeeTimesheets = async (req, res) => {
  try {
    const { employee_id, start_date, end_date } = req.query;

    console.log(req.user, ":::////");

    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "employee_id, start_date, and end_date are required",
      });
    }

    const startDate = moment(start_date).startOf("day").toDate();
    const endDate = moment(end_date).endOf("day").toDate();

    console.log(
      `Fetching timesheets for employee ID: ${employee_id} from ${start_date} to ${end_date}`,
    );

    // Fetch timesheets for the specific employee within the date range
    const timesheets = await Timesheet.findAll({
      where: {
        status: "complete", // Only fetch completed timesheets
      },
      include: [
        {
          model: Schedule,
          as: "schedule",
          where: {
            is_deleted: false,
            employee_id: employee_id,
            start_time: {
              [Op.gte]: startDate,
              [Op.lte]: endDate,
            },
          },
          attributes: ["id", "start_time"],
          include: [
            {
              model: Event,
              attributes: ["event_name"],
            },
            {
              model: ContractorClass,
              attributes: ["id"],
              include: [
                {
                  model: Classification,
                  as: "classification",
                  attributes: ["abbreviation"],
                },
                {
                  model: EventLocationContractor,
                  as: "assignment",
                  attributes: ["id"],
                  include: [
                    {
                      model: EventLocation,
                      attributes: ["id"],
                      include: [
                        {
                          model: Location,
                          attributes: ["name"],
                        },
                      ],
                    },
                    {
                      model: Contractor,
                      attributes: ["company_name"],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      attributes: ["id", "st", "ot", "dt"],
      order: [[{ model: Schedule, as: "schedule" }, "start_time", "ASC"]],
    });

    console.log("Fetched Timesheets:", timesheets.length);

    // Fetch timesheet_amount from admin_configs
    let timesheetAmount = 0.5; // Default value
    if (req.user && req.user.userId) {
      const adminConfig = await AdminConfig.findOne({
        where: { user_id: req.user.userId },
        attributes: ["timesheet_amount"],
      });
      if (adminConfig && adminConfig.timesheet_amount) {
        timesheetAmount = adminConfig.timesheet_amount;
      }
    }

    console.log("Timesheet Amount from Admin Config:", timesheetAmount);

    if (timesheets.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No timesheet data found for the specified employee and date range",
        data: [],
        total_records: 0,
        timesheet_amount: timesheetAmount,
      });
    }

    // Transform to simplified structure
    const transformedData = timesheets
      .map((timesheet) => {
        const schedule = timesheet.schedule;
        if (
          !schedule ||
          !schedule.Event ||
          !schedule.ContractorClass ||
          !schedule.ContractorClass.classification ||
          !schedule.ContractorClass.assignment ||
          !schedule.ContractorClass.assignment.EventLocation ||
          !schedule.ContractorClass.assignment.EventLocation.Location ||
          !schedule.ContractorClass.assignment.Contractor
        ) {
          console.warn(
            `Skipping timesheet ${timesheet.id} - Missing required relations`,
          );
          return null;
        }

        const st = timesheet.st || 0;
        const ot = timesheet.ot || 0;
        const dt = timesheet.dt || 0;
        const totalHours = st + ot + dt;

        return {
          date: moment(schedule.start_time).format("YYYY-MM-DD"),
          contractor_company_name:
            schedule.ContractorClass.assignment.Contractor.company_name,
          event_name: schedule.Event.event_name,
          location:
            schedule.ContractorClass.assignment.EventLocation.Location.name,
          class: schedule.ContractorClass.classification.abbreviation,
          st: st,
          ot: ot,
          dt: dt,
          total_hours: totalHours,
        };
      })
      .filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      message: "Timesheet data retrieved successfully",
      data: transformedData,
      total_records: transformedData.length,
      timesheet_amount: timesheetAmount,
    });
  } catch (error) {
    console.error("Error fetching timesheet data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
