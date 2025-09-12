const { Op, Sequelize, fn, col, literal, where } = require("sequelize");
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
const {
  Schedule,
  Employee,
  Location,
  Event,
  User,
  Classification,
  EventLocationContractor,
  EventLocation,
  Contractor,
  TimeOffReason,
  TimeOff,
  RecurringBlockedTime,
  ContractorClass,
  AdminConfig,
} = require("../models");
const moment = require("moment");
const sequelize = require("../config/database");
const crypto = require("crypto");

const twilio = require("twilio");
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

// Create Schedule
const createSchedule = async (req, res) => {
  try {
    const { employee_id, location_id, shift_date } = req.body;

    if (!employee_id || !location_id || !shift_date) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employee_id);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Check if location exists
    const location = await Location.findByPk(location_id);
    if (!location) return res.status(404).json({ error: "Location not found" });

    // Create schedule if no conflicts
    const schedule = await Schedule.create({
      employee_id,
      location_id,
      shift_date,
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// const createBulkSchedule = async (req, res) => {
//   try {
//     const {
//       startDate,
//       endDate,
//       taskEvent,
//       title,
//       description,
//       selectedEmployees,
//     } = req.body;

//     if (
//       !startDate ||
//       !endDate ||
//       !taskEvent ||
//       !title ||
//       !selectedEmployees.length
//     ) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     console.log(startDate, endDate, "====**********");

//     const employeeIds = selectedEmployees.map((emp) => emp.value);

//     // Convert frontend input (local time) to full UTC format
//     const startDateUTC = moment(startDate, "YYYY-MM-DDTHH:mm").utc().format();

//     const endDateUTC = moment(endDate, "YYYY-MM-DDTHH:mm").utc().format();

//     console.log(startDateUTC, endDateUTC, "====%%%%%%%%%%%%5*");

//     // Fetch existing schedules that overlap with the given time slot
//     const existingSchedules = await Schedule.findAll({
//       where: {
//         employee_id: employeeIds,
//         start_date: { [Op.lte]: endDateUTC },
//         end_date: { [Op.gte]: startDateUTC },
//       },
//       include: [
//         {
//           model: Employee,
//           attributes: ["id", "user_id"],
//           include: [
//             {
//               model: User,
//               attributes: ["first_name", "last_name"],
//             },
//           ],
//         },
//       ],
//     });

//     console.log(existingSchedules, "====**********");

//     // Extract IDs of employees who are already scheduled
//     const occupiedEmployeeIds = existingSchedules.map(
//       (schedule) => schedule.employee_id,
//     );

//     // Get names of occupied employees
//     const occupiedEmployees = existingSchedules.map((schedule) => ({
//       id: schedule.employee_id,
//       name: schedule.Employee?.User
//         ? `${schedule.Employee.User.first_name} ${schedule.Employee.User.last_name}`
//         : "Unknown Employee",
//     }));

//     // Filter out available employees
//     const availableEmployees = selectedEmployees.filter(
//       (emp) => !occupiedEmployeeIds.includes(emp.value),
//     );

//     if (availableEmployees.length > 0) {
//       // Prepare schedules for available employees
//       const schedules = availableEmployees.map((emp) => ({
//         employee_id: emp.value,
//         task_event_id: taskEvent,
//         title,
//         description,
//         start_date: startDate,
//         end_date: endDate,
//         status: "scheduled",
//       }));

//       await Schedule.bulkCreate(schedules);
//     }

//     return res.status(201).json({
//       message: availableEmployees.length
//         ? "Schedules created successfully for available employees."
//         : "No schedules were created as all employees were occupied.",
//       occupiedEmployees,
//       createdSchedules: {
//         employees: availableEmployees.map((emp) => ({
//           id: emp.value,
//           name: emp.label, // Assuming the frontend sends employee name in `label`
//         })),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Get Schedules

// const createBulkSchedule = async (req, res) => {
//   try {
//     const {
//       startDate, // Example: "2025-03-16T03:45"
//       endDate, // Example: "2025-03-20T06:45"
//       taskEvent,
//       title,
//       description,
//       selectedEmployees,
//     } = req.body;

//     if (
//       !startDate ||
//       !endDate ||
//       !taskEvent ||
//       !title ||
//       !selectedEmployees.length
//     ) {
//       return res.status(400).json({ error: "All fields are required" });
//     }

//     console.log(startDate, endDate, "====**********");

//     const employeeIds = selectedEmployees.map((emp) => emp.value);

//     // Convert input to UTC format for storage
//     // ✅ Step 1: Convert to UTC
//     const startDateUTC = moment(startDate).utc();
//     const endDateUTC = moment(endDate).utc();

//     // ✅ Step 2: Extract UTC date and time separately
//     const newStartDate = startDateUTC.format("YYYY-MM-DD"); // Extract only date
//     const newEndDate = endDateUTC.format("YYYY-MM-DD"); // Extract only date
//     const newStartTime = startDateUTC.format("HH:mm:ss"); // Extract only time
//     const newEndTime = endDateUTC.format("HH:mm:ss"); // Extract only time

//     console.log(
//       startDateUTC,
//       endDateUTC,
//       newStartDate,
//       newEndDate,
//       newStartTime,
//       newEndTime,
//       "====**********",
//     );

//     // Fetch existing schedules that overlap
//     const existingSchedules = await Schedule.findAll({
//       where: {
//         employee_id: { [Op.in]: employeeIds },
//         start_date: { [Op.lte]: newEndDate },
//         end_date: { [Op.gte]: newStartDate },
//         [Op.and]: [
//           {
//             [Op.or]: [
//               // Overlapping date range
//               {
//                 start_date: { [Op.lte]: newEndDate },
//                 end_date: { [Op.gte]: newStartDate },
//               },
//             ],
//           },
//           {
//             [Op.or]: [
//               // Overlapping time range
//               {
//                 start_time: { [Op.lt]: newEndTime },
//                 end_time: { [Op.gt]: newStartTime },
//               },
//               {
//                 start_time: null, // To allow full-day schedules if applicable
//                 end_time: null,
//               },
//             ],
//           },
//         ],
//       },
//       include: [
//         {
//           model: Employee,
//           attributes: ["id", "user_id"],
//           include: [
//             {
//               model: User,
//               attributes: ["first_name", "last_name", "image_url"],
//             },
//           ],
//         },
//       ],
//     });

//     console.log(
//       JSON.stringify(existingSchedules, null, 2),
//       "==== Existing Schedules",
//     );

//     // Extract conflicting employees
//     const occupiedEmployeeIds = existingSchedules.map(
//       (schedule) => schedule.employee_id,
//     );
//     const occupiedEmployees = existingSchedules.map((schedule) => ({
//       id: schedule.employee_id,
//       name: schedule.Employee?.User
//         ? `${schedule.Employee.User.first_name} ${schedule.Employee.User.last_name}`
//         : "Unknown Employee",
//     }));

//     // Filter out available employees
//     const availableEmployees = selectedEmployees.filter(
//       (emp) => !occupiedEmployeeIds.includes(emp.value),
//     );

//     console.log(newStartDate, newEndDate, newStartTime, newEndTime, "==== New");

//     let employeesScheduled = [];
//     let locationData = null; // ✅ NEW: Store location details

//     if (availableEmployees.length > 0) {
//       // Prepare and insert schedules for available employees
//       const schedules = availableEmployees.map((emp) => ({
//         employee_id: emp.value,
//         task_event_id: taskEvent,
//         title,
//         description,
//         start_date: newStartDate,
//         end_date: newEndDate,
//         start_time: newStartTime,
//         end_time: newEndTime,
//         status: "scheduled",
//       }));

//       // await Schedule.bulkCreate(schedules);

//       await Schedule.bulkCreate(schedules, {
//         returning: true,
//       });

//       console.log(availableEmployees, "==== Available Employees");

//       employeesScheduled = availableEmployees.map((emp) => ({
//         id: emp.value,
//         label: emp.label,
//         image_url: emp.imageUrl,
//       }));
//     }

//     // ✅ NEW: Fetch event name from Events table
//     const eventDetails = await Event.findOne({
//       where: { id: taskEvent },
//       attributes: ["event_name", "location_id"],
//     });

//     // ✅ NEW: Fetch location details from Locations table using location_id
//     if (eventDetails && eventDetails.location_id) {
//       const locationDetails = await Location.findOne({
//         where: { id: eventDetails.location_id }, // ✅ Corrected: Now using location_id
//         attributes: [
//           "name",
//           "address_1",
//           "address_2",
//           "city",
//           "state",
//           "postal_code",
//         ],
//       });

//       if (locationDetails) {
//         locationData = {
//           name: locationDetails.name,
//           address1: locationDetails.address_1,
//           address2: locationDetails.address_2,
//           city: locationDetails.city,
//           state: locationDetails.state,
//           postalCode: locationDetails.postal_code,
//         };
//       }
//     }

//     return res.status(201).json({
//       message: availableEmployees.length
//         ? "Schedules created successfully for available employees."
//         : "No schedules were created as selected employees were occupied.",
//       occupiedEmployees,
//       scheduledData: availableEmployees.length
//         ? {
//             title,
//             description,
//             startDate: moment.utc(newStartDate).local().format("YYYY-MM-DD"),
//             endDate: moment.utc(newEndDate).local().format("YYYY-MM-DD"),
//             startTime: moment
//               .utc(newStartTime, "HH:mm:ss")
//               .local()
//               .format("hh:mm A"),
//             endTime: moment
//               .utc(newEndTime, "HH:mm:ss")
//               .local()
//               .format("hh:mm A"),
//             location: locationData, // ✅ NEW
//             eventName: eventDetails ? eventDetails.event_name : "Unknown Event", // ✅ NEW

//             employees: employeesScheduled,
//           }
//         : null,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: error.message });
//   }
// };

// const getSchedules = async (req, res) => {
//   try {
//     const {
//       employee_id,
//       location_id,
//       start_date,
//       end_date,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const whereClause = { is_deleted: false };

//     if (employee_id) whereClause.employee_id = employee_id;
//     if (location_id) whereClause.location_id = location_id;
//     if (start_date && end_date) {
//       whereClause.shift_date = { [Op.between]: [start_date, end_date] };
//     }

//     const offset = (page - 1) * limit;

//     const schedules = await Schedule.findAndCountAll({
//       where: whereClause,
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//       order: [["shift_date", "ASC"]],
//     });

//     res.status(200).json({
//       total: schedules.count,
//       pages: Math.ceil(schedules.count / limit),
//       data: schedules.rows,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Update Schedule

const createBulkSchedule = async (req, res) => {
  try {
    const scheduleData = req.body;

    if (!scheduleData || typeof scheduleData !== "object") {
      return res.status(400).json({ error: "Invalid payload structure" });
    }

    const scheduleEntries = [];

    console.log(scheduleData, "/..// Schedule data ***********");

    for (const [employeeId, details] of Object.entries(scheduleData)) {
      const {
        eventId,
        locationContractorId,
        classificationId,
        startTime,
        comments,
      } = details;

      if (!eventId || !startTime) {
        return res.status(400).json({
          error: `Missing required fields for employee ${employeeId}`,
        });
      }

      const responseToken = crypto.randomBytes(16).toString("hex");

      console.log(
        responseToken,
        "????>>>>>>>>>>>=====",
        process.env.JWT_SECRET,
        "==---+++",
        process.env.FRONTEND_URL,
        process.env.TWILIO_ACCOUNT_SID,
      );

      scheduleEntries.push({
        employee_id: parseInt(employeeId),
        task_event_id: eventId,
        event_location_contractor_id: locationContractorId || null,
        contractor_class_id: classificationId || null,
        start_time: new Date(startTime), // UTC
        comments: comments || null,
        status: "pending",
        response_token: responseToken,
        responded_at: null,
      });

      const event = await Event.findByPk(eventId, {
        attributes: ["event_name"],
      });

      const locationData = await EventLocationContractor.findByPk(
        locationContractorId,
        {
          include: {
            model: EventLocation,
            include: {
              model: Location,
              attributes: ["name"],
            },
          },
        },
      );

      const scheduleLink = `${process.env.FRONTEND_URL}/schedule/${responseToken}`;
      const formattedTime = new Date(startTime).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const scheduleMessage = await AdminConfig.findOne({
        where: { user_id: req.user.userId },
      });

      const employee = await Employee.findByPk(employeeId, {
        attributes: ["phone"],
      });

      const baseMessage = scheduleMessage?.new_schedule_message;

      const messageBody =
        baseMessage
          .replace("[Event]", event.event_name)
          .replace("[Location]", locationData.EventLocation.Location.name)
          .replace("[Start Date]", formattedTime)
          .replace("[Start Time]", formattedTime) +
        `. Confirm 👉 ${scheduleLink}`;

      // const messageBody = `You are scheduled for ${event.event_name} at ${locationData.EventLocation.Location.name} from ${formattedTime}. Confirm 👉 ${scheduleLink}`;

      // **Send SMS to Employee**
      const employeePhone = "+17736107719"; // Hardcoded for now, later replace with actual employee's number
      // const employeePhone = employee.phone; +1 (773) 610-7719   "+13123711639"

      console.log("/////===============", scheduleLink);
      console.log(messageBody, "sms message body--", "===", employeePhone);

      await client.messages.create({
        body: messageBody,
        from: "+17087345990",
        to: employeePhone,
      });
    }

    await Schedule.bulkCreate(scheduleEntries, { returning: true });

    return res.status(201).json({
      message: "Bulk schedules created successfully",
      count: scheduleEntries.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

const getSchedules = async (req, res) => {
  try {
    const { status, task_event_id, location_id, search, capacity } = req.query;
    const date = req.params.date;

    const inputDate = moment(date, "YYYY-MM-DD"); // 🔸 Added

    const dayLetterMap = {
      0: "Su",
      1: "M",
      2: "T",
      3: "W",
      4: "Th",
      5: "F",
      6: "Sa",
    }; // 🔸 Added
    const dayLetter = dayLetterMap[inputDate.day()]; // 🔸 Added

    const whereClause = {
      is_deleted: false,
      [Op.and]: [where(fn("DATE", col("Schedule.start_time")), date)],
    };

    if (status && ["pending", "confirmed", "declined"].includes(status)) {
      whereClause.status = status;
    }

    if (task_event_id) {
      whereClause.task_event_id = task_event_id;
    }

    if (location_id) {
      whereClause["$EventLocationContractor.EventLocation.location_id$"] =
        location_id;
    }

    const userWhereClause = {};
    if (search) {
      userWhereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          attributes: ["id", "phone", "snf"],
          required: !!search,
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name"],
              ...(search && { where: userWhereClause, required: true }),
            },
            {
              association: "restrictions",
              through: { attributes: [] },
            },
            {
              model: RecurringBlockedTime,
              as: "recurringBlockedTimes",
              attributes: ["start_date", "end_date", "day_of_week"],
            },
            {
              model: TimeOff,
              as: "timeOffs",
              attributes: ["start_date", "end_date"],
            },
          ],
        },
        {
          model: Event,
          attributes: ["id", "event_name"],
          include: [
            {
              model: EventLocation,
              include: [{ model: Location, attributes: ["name"] }],
            },
          ],
        },
        {
          model: EventLocationContractor,
          include: [
            {
              model: Contractor,
              attributes: ["first_name", "last_name", "company_name"],
            },
            {
              model: EventLocation,
              attributes: ["id", "location_id"],
              include: [
                {
                  model: Location,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
        // {
        //   model: Classification,
        //   attributes: ["abbreviation", "description", "id"],
        // },
        {
          model: ContractorClass,
          attributes: ["id", "class_type", "start_time", "end_time"],
          include: [
            {
              model: Classification,
              as: "classification", // because you defined alias in model
              attributes: ["id", "abbreviation", "description"],
            },
          ],
        },
      ],
      // order: [["start_time", "ASC"]],
      order: [[sequelize.literal('"Employee"."snf"::INTEGER'), "ASC"]],
    });

    // 🟩 ADDED CAPACITY CALCULATION
    const formatted = schedules.map((schedule) => {
      const employee = schedule.Employee || {};
      const user = employee.User || {};
      const restriction = employee.restrictions || null;
      const event = schedule.Event || {};
      const contractor = schedule.EventLocationContractor || {};
      // const classification = schedule.Classification || {};
      const contractorClass = schedule.ContractorClass || {};
      const classification = contractorClass.classification || {};
      const EventLocationContractor = contractor;

      console.log(contractorClass, "????");

      // 🔸 Capacity logic copied from other controller
      let capacity = "Available";
      const isUnavailable = (employee.timeOffs || []).some(
        (t) =>
          moment(t.start_date).isSameOrBefore(inputDate, "day") &&
          moment(t.end_date).isSameOrAfter(inputDate, "day"),
      );

      if (isUnavailable) {
        capacity = "Unavailable";
      } else {
        const isLimited = (employee.recurringBlockedTimes || []).some(
          (b) =>
            b.day_of_week === dayLetter &&
            moment(b.start_date).isSameOrBefore(inputDate, "day") &&
            moment(b.end_date).isSameOrAfter(inputDate, "day"),
        );

        if (isLimited) {
          capacity = "Limited";
        }
      }

      return {
        id: schedule.id,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        employee_id: employee.id || "",
        phone: employee.phone || "",
        snf: employee.snf || "",
        status: schedule.status || "",
        employee_restrictions: restriction,
        capacity, // ✅ Added to response
        event: {
          event_id: event.id,
          eventName: event.event_name,
        },
        location_contractor: {
          id: EventLocationContractor.id,
          name: `${EventLocationContractor?.EventLocation?.Location?.name} - ${EventLocationContractor?.Contractor?.first_name} ${EventLocationContractor?.Contractor?.last_name}`,
        },
        class: {
          ...classification,
          class_type: contractorClass.class_type,
          contractor_class_id: contractorClass.id,
        },
        start_time: schedule.start_time,
        comments: schedule.comments || "",
      };
    });

    const filtered = capacity
      ? formatted.filter((row) => row.capacity === capacity)
      : formatted;

    return res.status(200).json(filtered);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getLatestConfirmedAssignments = async (req, res) => {
  try {
    const { employeeIds } = req.body;

    const assignments = await Schedule.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        status: "confirmed",
      },
      include: [
        { model: Event, attributes: ["event_name", "id"] },
        {
          model: EventLocationContractor,
          attributes: ["id"],
          include: [
            {
              model: Contractor,
              attributes: ["first_name", "last_name", "company_name", "id"],
            },
            {
              model: EventLocation,
              attributes: ["id"],
              include: [{ model: Location, attributes: ["name", "id"] }],
            },
          ],
        },
        {
          model: ContractorClass,
          attributes: ["id", "class_type", "start_time", "end_time"],
          include: [
            {
              model: Classification,
              as: "classification", // because you defined alias in model
              attributes: ["id", "abbreviation", "description"],
            },
          ],
        },
      ],
      order: [["start_time", "DESC"]],
      // raw: true,
    });

    console.log(assignments, "Latest confirmed assignments");

    // Group by employee_id and return only latest per employee
    const grouped = {};

    // Initialize all requested employeeIds with null
    for (const id of employeeIds) {
      grouped[id] = null;
    }

    for (const assignment of assignments) {
      if (!grouped[assignment.employee_id]) {
        const contractor = assignment.EventLocationContractor?.Contractor;
        const location =
          assignment.EventLocationContractor?.EventLocation?.Location;
        // const classification = assignment.Classification;
        const contractorClass = assignment.ContractorClass || {};
        const classification = contractorClass.classification || {};

        grouped[assignment.employee_id] = {
          event_name: assignment.Event?.event_name,
          event_id: assignment.Event?.id,
          location: location?.name || "",
          location_id: location?.id || null,
          event_location_contractor_id:
            assignment.event_location_contractor_id || "",
          contractor: contractor?.first_name || contractor?.company_name || "",
          start_time: assignment.start_time,
          classification_id: assignment.ContractorClass.id || null,
          classification_name: classification?.abbreviation || null,
          class_type: contractorClass.class_type || null,
          comments: assignment.comments || "",
        };
      }
    }

    console.log("grouped assignments:", grouped);

    return res.status(200).json(grouped);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

const getWeeklySchedules = async (req, res) => {
  try {
    let { currentWeekStart } = req.query;

    if (!currentWeekStart) {
      return res.status(400).json({ error: "currentWeekStart is required" });
    }

    // Convert to Date object
    currentWeekStart = new Date(currentWeekStart);

    // Compute `currentWeekEnd` (Saturday of the same week)
    let currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Add 6 days

    console.log(
      "Fetching schedules from:",
      currentWeekStart,
      "to",
      currentWeekEnd,
    );

    // Fetch schedules that overlap this week
    const schedules = await Schedule.findAll({
      where: {
        [Op.and]: [
          { start_date: { [Op.lte]: currentWeekEnd } }, // Starts before or during the week
          { end_date: { [Op.gte]: currentWeekStart } }, // Ends after or during the week
        ],
      },
      include: [
        {
          model: Employee,
          attributes: ["id"],
          include: [
            {
              model: User,
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        },
        {
          model: Event,
          attributes: ["id", "location_id"],
          include: [
            {
              model: Location,
              attributes: ["id", "colour_code", "name"],
            },
          ],
        },
      ],
    });

    // Organize data by employee
    const employeeSchedules = {};

    schedules.forEach((schedule) => {
      const user = schedule.Employee?.User;
      if (!user) return;

      const colour_code = schedule.Event?.Location?.colour_code || null;
      const locationName = schedule.Event?.Location?.name || "";

      if (!employeeSchedules[user.id]) {
        employeeSchedules[user.id] = {
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          schedules: [],
        };
      }

      employeeSchedules[user.id].schedules.push({
        schedule_id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        status: schedule.status,
        colour_code: colour_code,
        locationName: locationName,
        // days: getScheduleDays(schedule.start_date, schedule.end_date),
      });
    });

    // Convert object to array
    const formattedResponse = Object.values(employeeSchedules);

    res.json(formattedResponse);
  } catch (error) {
    console.error("Error fetching weekly schedules:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMonthlySchedules = async (req, res) => {
  try {
    let { month } = req.params;

    if (!month) {
      return res
        .status(400)
        .json({ error: "month is required (format: YYYY-MM)" });
    }

    // Compute first and last day of the month

    // const startOfMonth = new Date(`${month}-01`);
    // const startOfMonth = new Date(`${month}-01T00:00:00Z`);

    // const endOfMonth = new Date(startOfMonth);
    // endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    // endOfMonth.setDate(0); // Last day of the month

    // Get first and last day of the month in UTC-safe way
    const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
    const [year, monthStr] = month.split("-");
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(monthStr, 10);

    // Get last day of the month
    const endOfMonth = new Date(Date.UTC(yearNum, monthNum, 0)); // 0 means last day of previous month (after month + 1)

    console.log("Fetching schedules from:", startOfMonth, "to", endOfMonth);

    // Fetch schedules that overlap the given month
    const schedules = await Schedule.findAll({
      where: {
        [Op.and]: [
          { start_date: { [Op.lte]: endOfMonth } },
          { end_date: { [Op.gte]: startOfMonth } },
        ],
      },
      include: [
        {
          model: Employee,
          attributes: ["id"],
          include: [
            {
              model: User,
              attributes: ["id", "first_name", "last_name"],
            },
          ],
        },
        {
          model: Event, // Include event details
          attributes: ["id", "location_id", "event_name"],
          include: [
            {
              model: Location, // Include location details
              attributes: ["id", "name", "colour_code"],
            },
          ],
        },
      ],
    });

    console.log("Fetched schedules:", schedules);

    // Transform data into the required format
    const groupedSchedules = schedules.reduce((acc, schedule) => {
      if (!schedule.Employee || !schedule.Employee.User) return acc;

      const { id, first_name, last_name } = schedule.Employee.User;
      const userKey = id;

      if (!acc[userKey]) {
        acc[userKey] = {
          user_id: id,
          first_name,
          last_name,
          schedules: [],
        };
      }

      acc[userKey].schedules.push({
        schedule_id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        status: schedule.status,
        event_name: schedule.Event?.event_name || "", // Get event_name, fallback to ""
        location_name: schedule.Event?.Location?.name || "", // Get location name, fallback to ""
        colour_code: schedule.Event?.Location?.colour_code,
      });

      return acc;
    }, {});

    // Convert object to array format
    res.json(Object.values(groupedSchedules));
  } catch (error) {
    console.error("Error fetching monthly schedules:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getClassList = async (req, res) => {
  try {
    const classList = await Classification.findAll({
      attributes: ["id", "description", "abbreviation"],
    });
    res.status(200).json(classList);
  } catch (error) {
    console.error("Error fetching class list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTimeOffReason = async (req, res) => {
  try {
    const reasons = await TimeOffReason.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    res.status(200).json({ success: true, data: reasons });
  } catch (error) {
    console.error("Error fetching time off reasons:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch time off reasons",
    });
  }
};

const eventList = async (req, res) => {
  try {
    const { date } = req.params;

    const today = moment().startOf("day").toDate(); // Get today's date

    const events = await Event.findAll({
      attributes: ["id", "event_name"],
      where: {
        start_date: { [Op.lte]: date },
        end_date: { [Op.gte]: date },
      },
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
              attributes: ["id"], // <-- important
              include: [
                {
                  model: Contractor,
                  attributes: ["id", "first_name", "last_name", "company_name"],
                },
                // {
                // model: ContractorClass,
                // as: "classes",
                // attributes: [
                //   "id",
                //   "classification_id",
                //   "class_type",
                //   "start_time",
                //   "end_time",
                // ],
                // include: [
                //   {
                //     model: Classification,
                //     as: "classification",
                //     attributes: ["id", "abbreviation", "description"],
                //   },
                // ],
                // },
              ],
            },
          ],
        },
      ],
      order: [["id", "ASC"]],
      // raw: true,
    });

    // 2️⃣ Gather all EventLocationContractor IDs
    const contractorAssignmentIds = [];
    events.forEach((event) => {
      event.EventLocations.forEach((loc) => {
        loc.EventLocationContractors.forEach((elc) => {
          contractorAssignmentIds.push(elc.id);
        });
      });
    });

    // 3️⃣ Fetch all ContractorClasses for these assignments
    const allClasses = await ContractorClass.findAll({
      where: { assignment_id: contractorAssignmentIds },
      attributes: [
        "id",
        "assignment_id",
        "classification_id",
        "class_type",
        "start_time",
        "end_time",
      ],
      include: [
        {
          model: Classification,
          as: "classification",
          attributes: ["id", "abbreviation", "description", "order_number"],
        },
      ],
      // raw: true,
      // nest: true,
    });

    // 4️⃣ Group classes by assignment_id for easy lookup
    const classesByAssignment = {};
    allClasses.forEach((cls) => {
      if (!classesByAssignment[cls.assignment_id]) {
        classesByAssignment[cls.assignment_id] = [];
      }
      classesByAssignment[cls.assignment_id].push(cls);
    });

    // 5️⃣ Format the data for frontend
    const formatted = events.map((event) => ({
      id: event.id,
      event_name: event.event_name,
      locations: event.EventLocations.map((loc) => ({
        id: loc.Location?.id,
        name: loc.Location?.name,
        contractors: loc.EventLocationContractors.map((elc) => ({
          id: elc.Contractor?.id,
          name: `${elc.Contractor?.first_name} ${elc.Contractor?.last_name}`,
          company_name: elc.Contractor?.company_name,
          event_location_contractor_id: elc.id,
          classes: (classesByAssignment[elc.id] || []).map((cls) => {
            return {
              id: cls.id,
              classification_id: cls.classification_id,
              class_type: cls.class_type,
              start_time: cls.start_time,
              end_time: cls.end_time,
              classification: cls.classification
                ? {
                    id: cls.classification.id,
                    abbreviation: cls.classification.abbreviation,
                    description: cls.classification.description,
                    orderNumber:
                      cls.classification.getDataValue("order_number"),
                  }
                : null,
            };
          }),
        })),
      })),
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const employeeSchedules = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { status, startDate, endDate } = req.query;

    const employeeId = await Employee.findOne({
      where: {
        user_id: req.user.userId,
      },
      attributes: ["id"],
    });

    console.log(employeeId.getDataValue("id"), "????----Employeeeeee");

    let whereCondition = {
      employee_id: employeeId.getDataValue("id"),
      is_deleted: false,
    };

    // Filter by status (optional)
    if (status) {
      whereCondition.status = status;
    }

    console.log(startDate, endDate, "??????????");

    // Filter schedules that overlap with the given date range
    // if (startDate && endDate) {
    //   whereCondition[Op.and] = [
    //     { start_date: { [Op.lte]: endDate } }, // Starts on or before the requested end_date
    //     { end_date: { [Op.gte]: startDate } }, // Ends on or after the requested start_date
    //   ];
    // }

    if (startDate && endDate) {
      whereCondition.start_time = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    console.log(whereCondition, "?????........");

    // const schedules = await Schedule.findAll({
    //   where: whereCondition,

    //   include: [
    //     // { model: Employee, attributes: ["id", "name", "email"] },
    //     {
    //       model: Event,
    //       attributes: ["id", "event_name"],
    //       include: [
    //         {
    //           model: Location,
    //           attributes: [
    //             "name",
    //             "address_1",
    //             "address_2",
    //             "city",
    //             "state",
    //             "postal_code",
    //             "image_url",
    //             "colour_code",
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    //   order: [
    //     ["start_date", "ASC"],
    //     ["start_time", "ASC"],
    //   ],
    // });

    const schedules = await Schedule.findAll({
      where: whereCondition,
      include: [
        {
          model: Event,
          attributes: ["id", "event_name", "start_date", "end_date"],
          include: [
            {
              model: EventLocation,
              attributes: ["id"],
              include: [
                {
                  model: Location,
                  attributes: [
                    "id",
                    "name",
                    "address_1",
                    "address_2",
                    "city",
                    "state",
                    "postal_code",
                    "image_url",
                    "colour_code",
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [["start_time", "ASC"]],
    });

    console.log(schedules, "???????///////////////");

    return res.json({ success: true, data: schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("🔄 Incoming update for Schedule ID:", id);
    console.log("📝 Payload:", updateData);

    // Check if schedule exists
    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    console.log(schedule, "????? Schedule to update");

    const event = await Event.findByPk(updateData.event_id, {
      attributes: ["event_name"],
    });

    const locationData = await EventLocationContractor.findByPk(
      updateData.event_location_contractor_id,
      {
        include: {
          model: EventLocation,
          include: {
            model: Location,
            attributes: ["name"],
          },
        },
      },
    );

    const scheduleLink = `${process.env.FRONTEND_URL}/schedule/${schedule.response_token}`;
    const formattedTime = new Date(updateData.start_time).toLocaleString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      },
    );
    const messageBody = `Your schedule for ${event.event_name} at ${locationData.EventLocation.Location.name} is updated from ${formattedTime}. Confirm 👉 ${scheduleLink}`;

    // **Send SMS to Employee**
    const employeePhone = "+17736107719"; // Hardcoded for now, later replace with actual employee's number

    console.log("/////===============", scheduleLink);
    console.log(messageBody, "sms message body--", "===");

    await client.messages.create({
      body: messageBody,
      from: "+17087345990",
      to: employeePhone,
    });

    // Update only fields provided in request body
    await schedule.update({ ...updateData, status: "pending" });

    return res.status(200).json({
      message: "Schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    console.error("❌ Error updating schedule:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const checkEmployeeAvailability = async (req, res) => {
  try {
    const { employee_id, shift_date, start_time, end_time } = req.query;

    if (!employee_id || !shift_date || !start_time || !end_time) {
      return res.status(400).json({ error: "Missing required parameters." });
    }

    // Check if the employee has any overlapping shifts
    const conflict = await Schedule.findOne({
      where: {
        employee_id,
        shift_date,
        is_deleted: false,
        [Op.or]: [
          {
            start_time: { [Op.lt]: end_time },
            end_time: { [Op.gt]: start_time },
          },
        ],
      },
    });

    if (conflict) {
      return res.json({
        available: false,
        message: "Employee is already scheduled during this time.",
      });
    }

    res.json({ available: true, message: "Employee is available." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Soft Delete Schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });

    schedule.is_deleted = true;
    await schedule.save();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSchedulesReport = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, location_id, status } =
      req.query;

    let whereClause = { is_deleted: false };

    if (start_date && end_date) {
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    }
    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;
    if (status) whereClause.status = status;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ["id", "user_id", "position"] },
        { model: Location, attributes: ["id", "name"] },
      ],
    });

    res.status(200).json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportSchedulesCSV = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, location_id, status } =
      req.query;

    let whereClause = { is_deleted: false };
    if (start_date && end_date)
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;
    if (status) whereClause.status = status;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ["id", "user_id", "position"] },
        { model: Location, attributes: ["id", "name"] },
      ],
    });

    if (schedules.length === 0)
      return res
        .status(404)
        .json({ message: "No schedules found for the given filters" });

    const csvFields = [
      "ID",
      "Employee ID",
      "Location",
      "Date",
      "Start Time",
      "End Time",
      "Status",
    ];
    const csvData = schedules.map((s) => ({
      ID: s.id,
      "Employee ID": s.employee_id,
      Location: s.Location ? s.Location.name : "",
      Date: s.shift_date,
      "Start Time": s.start_time,
      "End Time": s.end_time,
      Status: s.status,
    }));

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(csvData);

    // 🔥 Generate unique filename
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const filePath = path.join(
      __dirname,
      `../exports/schedules_${timestamp}.csv`,
    );

    fs.writeFileSync(filePath, csv);

    res.download(filePath, `schedules_${timestamp}.csv`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportSchedulesExcel = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, location_id, status } =
      req.query;

    let whereClause = { is_deleted: false };
    if (start_date && end_date)
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;
    if (status) whereClause.status = status;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ["id", "user_id", "position"] },
        { model: Location, attributes: ["id", "name"] },
      ],
    });

    if (schedules.length === 0)
      return res
        .status(404)
        .json({ message: "No schedules found for the given filters" });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Schedules");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Employee ID", key: "employee_id", width: 15 },
      { header: "Location", key: "location", width: 20 },
      { header: "Date", key: "shift_date", width: 15 },
      { header: "Start Time", key: "start_time", width: 15 },
      { header: "End Time", key: "end_time", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    schedules.forEach((s) => {
      worksheet.addRow({
        id: s.id,
        employee_id: s.employee_id,
        location: s.Location ? s.Location.name : "",
        shift_date: s.shift_date,
        start_time: s.start_time,
        end_time: s.end_time,
        status: s.status,
      });
    });

    // 🔥 Generate unique filename
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const filePath = path.join(
      __dirname,
      `../exports/schedules_${timestamp}.xlsx`,
    );

    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, `schedules_${timestamp}.xlsx`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportSchedulesByLocationCSV = async (req, res) => {
  try {
    const { start_date, end_date, employee_id, location_id } = req.query;

    let whereClause = { is_deleted: false };
    if (start_date && end_date)
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };
    if (employee_id) whereClause.employee_id = employee_id;
    if (location_id) whereClause.location_id = location_id;

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ["id", "user_id", "position"] },
        { model: Location, attributes: ["id", "name"] },
      ],
      order: [["shift_date", "ASC"]],
    });

    if (schedules.length === 0)
      return res.status(404).json({ message: "No schedules found" });

    const csvFields = [
      "ID",
      "Employee ID",
      "Location",
      "Date",
      "Start Time",
      "End Time",
      "Status",
    ];
    const csvData = schedules.map((s) => ({
      ID: s.id,
      "Employee ID": s.employee_id,
      Location: s.Location ? s.Location.name : "",
      Date: s.shift_date,
      "Start Time": s.start_time,
      "End Time": s.end_time,
      Status: s.status,
    }));

    const parser = new Parser({ fields: csvFields });
    const csv = parser.parse(csvData);

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const filePath = path.join(
      __dirname,
      `../exports/schedules_${timestamp}.csv`,
    );

    fs.writeFileSync(filePath, csv);
    res.download(filePath, `schedules_${timestamp}.csv`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportExceeding40HoursReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = { is_deleted: false };
    if (start_date && end_date)
      whereClause.shift_date = { [Op.between]: [start_date, end_date] };

    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [{ model: Employee, attributes: ["id", "user_id", "position"] }],
      order: [["shift_date", "ASC"]],
    });

    if (schedules.length === 0)
      return res.status(404).json({ message: "No schedules found" });

    // Group employee hours per week
    let employeeHours = {};

    schedules.forEach((s) => {
      const week = moment(s.shift_date).format("YYYY-WW"); // Get Year-Week format
      const employeeKey = `${s.employee_id}-${week}`;

      const start = moment(s.start_time, "HH:mm:ss");
      const end = moment(s.end_time, "HH:mm:ss");
      const hoursWorked = moment.duration(end.diff(start)).asHours();

      if (!employeeHours[employeeKey]) {
        employeeHours[employeeKey] = {
          employee_id: s.employee_id,
          week,
          total_hours: 0,
        };
      }
      employeeHours[employeeKey].total_hours += hoursWorked;
    });

    // Convert to array and mark employees exceeding 40 hours
    const reportData = Object.values(employeeHours).map((record) => ({
      Employee_ID: record.employee_id,
      Week: record.week,
      Total_Hours: record.total_hours.toFixed(2),
      Notes: record.total_hours > 40 ? "Overtime Exceeded 40 Hours" : "",
    }));

    // Create Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Overtime Report");

    worksheet.columns = [
      { header: "Employee ID", key: "Employee_ID", width: 15 },
      { header: "Week", key: "Week", width: 10 },
      { header: "Total Hours", key: "Total_Hours", width: 15 },
      { header: "Notes", key: "Notes", width: 30 },
    ];

    reportData.forEach((row) => worksheet.addRow(row));

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "");
    const filePath = path.join(
      __dirname,
      `../exports/overtime_report_${timestamp}.xlsx`,
    );

    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, `overtime_report_${timestamp}.xlsx`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSchedule,
  createBulkSchedule,
  getSchedules,
  eventList,
  getWeeklySchedules,
  getMonthlySchedules,
  employeeSchedules,
  updateSchedule,
  deleteSchedule,
  getSchedulesReport,
  getTimeOffReason,
  exportSchedulesCSV,
  exportSchedulesExcel,
  checkEmployeeAvailability,
  exportSchedulesByLocationCSV,
  exportExceeding40HoursReport,
  getClassList,
  getLatestConfirmedAssignments,
};
