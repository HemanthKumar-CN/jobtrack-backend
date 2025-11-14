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
  Timesheet,
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
        start_time: startTime, // UTC
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
      const employeePhone = "+13123711639"; // Hardcoded for now, later replace with actual employee's number
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
    const {
      status,
      task_event_id,
      location_id,
      search,
      capacity,
      classification_id,
      contractor,
      type,
    } = req.query;
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

    if (classification_id) {
      whereClause["$ContractorClass.classification_id$"] = classification_id;
    }

    if (contractor) {
      whereClause["$EventLocationContractor.contractor_id$"] = contractor;
    }

    if (type) {
      whereClause["$ContractorClass.class_type$"] = type;
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
    const { employeeIds, todayDate } = req.body;

    // Calculate previous day from todayDate
    const previousDay = moment(todayDate)
      .subtract(1, "day")
      .format("YYYY-MM-DD");
    const startOfPreviousDay = moment(previousDay).startOf("day").toDate();
    const endOfPreviousDay = moment(previousDay).endOf("day").toDate();

    console.log(`Looking for assignments on previous day: ${previousDay}`);
    console.log(`UTC range: ${startOfPreviousDay} to ${endOfPreviousDay}`);

    const assignments = await Schedule.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        status: "confirmed",
        start_time: {
          [Op.gte]: startOfPreviousDay,
          [Op.lte]: endOfPreviousDay,
        },
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

    console.log(assignments, "Latest confirmed assignments from previous day");

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
        "need_number",
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
              need_number: cls.need_number,
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
    const employeePhone = "+13123711639"; // Hardcoded for now, later replace with actual employee's number

    console.log("/////===============", scheduleLink);
    console.log(messageBody, "sms message body--", "===");

    await client.messages.create({
      body: messageBody,
      from: "+17087345990",
      to: employeePhone,
    });

    // Update only fields provided in request body
    await schedule.update({ ...updateData, status: "pending" });

    // When schedule is updated and status is set to "pending",
    // delete any existing timesheet record
    const existingTimesheet = await Timesheet.findOne({
      where: { schedule_id: schedule.id },
    });

    if (existingTimesheet) {
      await existingTimesheet.destroy();
      console.log(
        `Timesheet deleted for schedule ID: ${schedule.id} due to schedule update`,
      );
    }

    return res.status(200).json({
      message: "Schedule updated successfully",
      data: schedule,
      timesheet_deleted: !!existingTimesheet,
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
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // Validate schedule ID
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid schedule ID provided",
      });
    }

    // Find schedule with transaction
    const schedule = await Schedule.findByPk(id, { transaction });
    if (!schedule) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: "Schedule not found",
      });
    }

    // Check if schedule is already deleted
    if (schedule.is_deleted) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: "Schedule has already been deleted",
      });
    }

    let timesheetDeleted = false;
    let timesheetId = null;

    // Check if schedule status is confirmed, then delete associated timesheet
    if (schedule.status === "confirmed") {
      const existingTimesheet = await Timesheet.findOne({
        where: { schedule_id: schedule.id },
        transaction,
      });

      if (existingTimesheet) {
        timesheetId = existingTimesheet.id;
        await existingTimesheet.destroy({ transaction });
        timesheetDeleted = true;
        console.log(
          `Timesheet (ID: ${timesheetId}) deleted for schedule ID: ${schedule.id} due to schedule deletion`,
        );
      }
    }

    // Perform soft delete on schedule
    await schedule.update({ is_deleted: true }, { transaction });

    // Commit transaction
    await transaction.commit();

    console.log(`Schedule (ID: ${schedule.id}) successfully soft deleted`);

    // Return success response with details
    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
      data: {
        schedule_id: schedule.id,
        schedule_status: schedule.status,
        timesheet_deleted: timesheetDeleted,
        timesheet_id: timesheetId,
        deleted_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();

    console.error("Error deleting schedule:", error);

    // Handle specific database errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation error occurred while deleting schedule",
        details: error.errors?.map((e) => e.message) || [],
      });
    }

    if (error.name === "SequelizeDatabaseError") {
      return res.status(500).json({
        success: false,
        error: "Database error occurred while deleting schedule",
        details: "Please contact support if this issue persists",
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: "Failed to delete schedule",
      details: error.message,
    });
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

const getScheduledEventList = async (req, res) => {
  try {
    const { eventDate } = req.params;

    // Step 1: Get all events for the date
    const events = await Event.findAll({
      where: {
        start_date: { [Op.lte]: eventDate },
        end_date: { [Op.gte]: eventDate },
      },
      order: [["start_date", "ASC"]],
    });

    if (events.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No events found for the specified date",
        data: [],
        total_events: 0,
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
          attributes: [
            "id",
            "name",
            "address_1",
            "city",
            "state",
            "colour_code",
          ],
        },
      ],
    });

    const eventLocationIds = eventLocations.map((el) => el.id);

    // Step 3: Get all event location contractors
    const eventLocationContractors = await EventLocationContractor.findAll({
      where: {
        event_location_id: { [Op.in]: eventLocationIds },
      },
      include: [
        {
          model: Contractor,
          attributes: [
            "id",
            "first_name",
            "last_name",
            "company_name",
            "email",
            "status",
          ],
        },
      ],
    });

    const eventLocationContractorIds = eventLocationContractors.map(
      (elc) => elc.id,
    );

    // Step 4: Get all contractor classes with classifications
    const contractorClasses = await ContractorClass.findAll({
      where: {
        assignment_id: { [Op.in]: eventLocationContractorIds },
      },
      include: [
        {
          model: Classification,
          as: "classification",
          attributes: [
            "id",
            "abbreviation",
            "description",
            "status",
            "order_number",
          ],
        },
      ],
    });

    const contractorClassIds = contractorClasses.map((cc) => cc.id);

    // Step 5: Get schedule counts by status for each contractor class
    const scheduleCounts = await Schedule.findAll({
      where: {
        contractor_class_id: { [Op.in]: contractorClassIds },
        is_deleted: false,
        [Op.and]: [where(fn("DATE", col("Schedule.start_time")), eventDate)],
      },
      attributes: [
        "contractor_class_id",
        "status",
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["contractor_class_id", "status"],
    });

    // Step 6: Create lookup maps for easy data association
    const eventLocationsMap = {};
    eventLocations.forEach((el) => {
      if (!eventLocationsMap[el.event_id]) {
        eventLocationsMap[el.event_id] = [];
      }
      eventLocationsMap[el.event_id].push(el);
    });

    const eventLocationContractorsMap = {};
    eventLocationContractors.forEach((elc) => {
      if (!eventLocationContractorsMap[elc.event_location_id]) {
        eventLocationContractorsMap[elc.event_location_id] = [];
      }
      eventLocationContractorsMap[elc.event_location_id].push(elc);
    });

    const contractorClassesMap = {};
    contractorClasses.forEach((cc) => {
      if (!contractorClassesMap[cc.assignment_id]) {
        contractorClassesMap[cc.assignment_id] = [];
      }
      contractorClassesMap[cc.assignment_id].push(cc);
    });

    // Create schedule counts map by contractor_class_id
    const scheduleCountsMap = {};
    scheduleCounts.forEach((sc) => {
      const classId = sc.getDataValue("contractor_class_id");
      const status = sc.getDataValue("status");
      const count = parseInt(sc.getDataValue("count"));

      if (!scheduleCountsMap[classId]) {
        scheduleCountsMap[classId] = {
          pending: 0,
          confirmed: 0,
          declined: 0,
        };
      }
      scheduleCountsMap[classId][status] = count;
    });

    // Step 6: Transform the data to flat structure
    const transformedData = [];

    events.forEach((event) => {
      const eventLocationsList = eventLocationsMap[event.id] || [];

      eventLocationsList.forEach((eventLocation) => {
        const eventLocationContractorsList =
          eventLocationContractorsMap[eventLocation.id] || [];

        eventLocationContractorsList.forEach((eventLocationContractor) => {
          const contractorClassesList =
            contractorClassesMap[eventLocationContractor.id] || [];

          // Group classes by class_type for each contractor
          const classTypes = {};
          contractorClassesList.forEach((contractorClass) => {
            const classType = contractorClass.class_type;
            if (!classTypes[classType]) {
              classTypes[classType] = [];
            }

            // Get schedule counts for this contractor class
            const scheduleCounts = scheduleCountsMap[contractorClass.id] || {
              pending: 0,
              confirmed: 0,
              declined: 0,
            };

            classTypes[classType].push({
              contractor_class_id: contractorClass.id,
              classification_id: contractorClass.classification_id,
              classification_abbreviation:
                contractorClass.classification.abbreviation,
              classification_order:
                contractorClass.classification.order_number || null,
              classification_description:
                contractorClass.classification.description,
              start_time: contractorClass.start_time,
              end_time: contractorClass.end_time,
              need_number: contractorClass.need_number,
              schedules: scheduleCounts, // Add schedule counts here
            });
          });

          // Create a single flat object for each event-location-contractor combination
          transformedData.push({
            // Event details
            event_id: event.id,
            event_name: event.event_name,
            project_code: event.project_code,
            project_comments: event.project_comments,
            event_start_date: event.start_date,
            event_end_date: event.end_date,

            // Location details
            event_location_id: eventLocation.id,
            location_id: eventLocation.Location.id,
            location_name: eventLocation.Location.name,
            location_address: eventLocation.Location.address_1,
            location_city: eventLocation.Location.city,
            location_state: eventLocation.Location.state,
            colour_code: eventLocation.Location.colour_code,

            // Contractor details
            event_location_contractor_id: eventLocationContractor.id,
            contractor_id: eventLocationContractor.Contractor.id,
            contractor_name: `${eventLocationContractor.Contractor.first_name} ${eventLocationContractor.Contractor.last_name}`,
            contractor_company: eventLocationContractor.Contractor.company_name,
            contractor_email: eventLocationContractor.Contractor.email,
            contractor_status: eventLocationContractor.Contractor.status,
            steward_id: eventLocationContractor.steward_id,

            // Classes grouped by type
            class_types: {
              regular: classTypes.regular || [],
              in: classTypes.in || [],
              out: classTypes.out || [],
            },
          });
        });
      });
    });

    res.status(200).json({
      success: true,
      message: "Scheduled events list retrieved successfully",
      data: transformedData,
      total_events: transformedData.length,
    });
  } catch (error) {
    console.error("Error fetching scheduled events list:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getTimeSheetEventList = async (req, res) => {
  try {
    const { eventDate } = req.params;

    // Step 1: Get all events for the date
    const events = await Event.findAll({
      where: {
        start_date: { [Op.lte]: eventDate },
        end_date: { [Op.gte]: eventDate },
      },
      order: [["start_date", "ASC"]],
    });

    if (events.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No events found for the specified date",
        data: [],
        total_events: 0,
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
          attributes: [
            "id",
            "name",
            "address_1",
            "city",
            "state",
            "colour_code",
          ],
        },
      ],
    });

    const eventLocationIds = eventLocations.map((el) => el.id);

    // Step 3: Get all event location contractors
    const eventLocationContractors = await EventLocationContractor.findAll({
      where: {
        event_location_id: { [Op.in]: eventLocationIds },
      },
      include: [
        {
          model: Contractor,
          attributes: [
            "id",
            "first_name",
            "last_name",
            "company_name",
            "email",
            "status",
          ],
        },
      ],
    });

    const eventLocationContractorIds = eventLocationContractors.map(
      (elc) => elc.id,
    );

    // Step 4: Get all contractor classes with classifications
    const contractorClasses = await ContractorClass.findAll({
      where: {
        assignment_id: { [Op.in]: eventLocationContractorIds },
      },
      include: [
        {
          model: Classification,
          as: "classification",
          attributes: [
            "id",
            "abbreviation",
            "description",
            "status",
            "order_number",
          ],
        },
      ],
    });

    const contractorClassIds = contractorClasses.map((cc) => cc.id);

    // Step 5: Get timesheet counts by status for each contractor class
    // First get confirmed schedules for the date
    // Create start and end of day for the given date to handle timezone properly
    const startOfDay = moment.utc(eventDate).startOf("day").toDate();
    const endOfDay = moment.utc(eventDate).endOf("day").toDate();

    const confirmedSchedules = await Schedule.findAll({
      where: {
        contractor_class_id: { [Op.in]: contractorClassIds },
        is_deleted: false,
        status: "confirmed",
        start_time: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
      attributes: ["id", "contractor_class_id"],
    });

    const scheduleIds = confirmedSchedules.map((s) => s.id);
    const scheduleToClassMap = {};
    confirmedSchedules.forEach((s) => {
      scheduleToClassMap[s.id] = s.contractor_class_id;
    });

    // Get timesheet counts by status
    const timesheetCounts = await Timesheet.findAll({
      where: {
        schedule_id: { [Op.in]: scheduleIds },
      },
      attributes: ["schedule_id", "status", [fn("COUNT", col("id")), "count"]],
      group: ["schedule_id", "status"],
    });

    console.log("Fetched Timesheet Counts:", timesheetCounts.length);

    // Step 6: Create lookup maps for easy data association
    const eventLocationsMap = {};
    eventLocations.forEach((el) => {
      if (!eventLocationsMap[el.event_id]) {
        eventLocationsMap[el.event_id] = [];
      }
      eventLocationsMap[el.event_id].push(el);
    });

    const eventLocationContractorsMap = {};
    eventLocationContractors.forEach((elc) => {
      if (!eventLocationContractorsMap[elc.event_location_id]) {
        eventLocationContractorsMap[elc.event_location_id] = [];
      }
      eventLocationContractorsMap[elc.event_location_id].push(elc);
    });

    const contractorClassesMap = {};
    contractorClasses.forEach((cc) => {
      if (!contractorClassesMap[cc.assignment_id]) {
        contractorClassesMap[cc.assignment_id] = [];
      }
      contractorClassesMap[cc.assignment_id].push(cc);
    });

    // Create timesheet counts map by contractor_class_id
    const timesheetCountsMap = {};
    timesheetCounts.forEach((tc) => {
      const scheduleId = tc.getDataValue("schedule_id");
      const status = tc.getDataValue("status");
      const count = parseInt(tc.getDataValue("count"));
      const classId = scheduleToClassMap[scheduleId];

      if (classId) {
        if (!timesheetCountsMap[classId]) {
          timesheetCountsMap[classId] = {
            open: 0,
            complete: 0,
          };
        }
        timesheetCountsMap[classId][status] =
          (timesheetCountsMap[classId][status] || 0) + count;
      }
    });

    // Step 7: Transform the data to flat structure
    const transformedData = [];

    events.forEach((event) => {
      const eventLocationsList = eventLocationsMap[event.id] || [];

      eventLocationsList.forEach((eventLocation) => {
        const eventLocationContractorsList =
          eventLocationContractorsMap[eventLocation.id] || [];

        eventLocationContractorsList.forEach((eventLocationContractor) => {
          const contractorClassesList =
            contractorClassesMap[eventLocationContractor.id] || [];

          // Group classes by class_type for each contractor
          const classTypes = {};
          contractorClassesList.forEach((contractorClass) => {
            const classType = contractorClass.class_type;
            if (!classTypes[classType]) {
              classTypes[classType] = [];
            }

            // Get timesheet counts for this contractor class
            const timesheetCounts = timesheetCountsMap[contractorClass.id] || {
              open: 0,
              complete: 0,
            };

            classTypes[classType].push({
              contractor_class_id: contractorClass.id,
              classification_id: contractorClass.classification_id,
              classification_abbreviation:
                contractorClass.classification.abbreviation,
              classification_order:
                contractorClass.classification.order_number || null,
              classification_description:
                contractorClass.classification.description,
              start_time: contractorClass.start_time,
              end_time: contractorClass.end_time,
              need_number: contractorClass.need_number,
              timesheets: timesheetCounts, // Add timesheet counts here
            });
          });

          // Create a single flat object for each event-location-contractor combination
          transformedData.push({
            // Event details
            event_id: event.id,
            event_name: event.event_name,
            project_code: event.project_code,
            project_comments: event.project_comments,
            event_start_date: event.start_date,
            event_end_date: event.end_date,

            // Location details
            event_location_id: eventLocation.id,
            location_id: eventLocation.Location.id,
            location_name: eventLocation.Location.name,
            location_address: eventLocation.Location.address_1,
            location_city: eventLocation.Location.city,
            location_state: eventLocation.Location.state,
            colour_code: eventLocation.Location.colour_code,

            // Contractor details
            event_location_contractor_id: eventLocationContractor.id,
            contractor_id: eventLocationContractor.Contractor.id,
            contractor_name: `${eventLocationContractor.Contractor.first_name} ${eventLocationContractor.Contractor.last_name}`,
            contractor_company: eventLocationContractor.Contractor.company_name,
            contractor_email: eventLocationContractor.Contractor.email,
            contractor_status: eventLocationContractor.Contractor.status,
            steward_id: eventLocationContractor.steward_id,

            // Classes grouped by type with timesheet counts
            class_types: {
              regular: classTypes.regular || [],
              in: classTypes.in || [],
              out: classTypes.out || [],
            },
          });
        });
      });
    });

    res.status(200).json({
      success: true,
      message: "Timesheet events list retrieved successfully",
      data: transformedData,
      total_events: transformedData.length,
    });
  } catch (error) {
    console.error("Error fetching timesheet events list:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getTimesheetdata = async (req, res) => {
  try {
    const { eventDate } = req.params;
    const { search, fourNo, ges, contractor, sortBy, sortOrder } = req.query; // Get all filter parameters including sort

    // Create start and end of day for the given date to handle timezone properly
    const startOfDay = moment.utc(eventDate).startOf("day").toDate();
    const endOfDay = moment.utc(eventDate).endOf("day").toDate();

    console.log(`Fetching timesheets for date: ${eventDate}`);
    console.log(`UTC range: ${startOfDay} to ${endOfDay}`);

    // Step 1: Get all timesheets for the specific date by joining with schedules
    let whereClause = {
      is_deleted: false,
      start_time: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay,
      },
    };

    // Define includes without search filtering (we'll filter in JavaScript after fetching)
    const userInclude = {
      model: User,
      attributes: ["id", "first_name", "last_name"],
    };

    const eventInclude = {
      model: Event,
      attributes: ["id", "event_name", "project_code", "event_type"],
    };

    const timesheets = await Timesheet.findAll({
      include: [
        {
          model: Schedule,
          as: "schedule",
          where: whereClause,
          include: [
            {
              model: Employee,
              attributes: ["id", "four", "ges"],
              include: [userInclude],
            },
            eventInclude,
            {
              model: ContractorClass,
              include: [
                {
                  model: Classification,
                  as: "classification",
                  attributes: ["id", "abbreviation", "description"],
                },
                {
                  model: EventLocationContractor,
                  as: "assignment",
                  include: [
                    {
                      model: EventLocation,
                      include: [
                        {
                          model: Location,
                          attributes: [
                            "id",
                            "name",
                            "address_1",
                            "city",
                            "state",
                            "colour_code",
                          ],
                        },
                      ],
                    },
                    {
                      model: Contractor,
                      attributes: [
                        "id",
                        "first_name",
                        "last_name",
                        "company_name",
                        "email",
                        "status",
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [
          { model: Schedule, as: "schedule" },
          { model: Event },
          "event_name",
          "ASC",
        ],
        [{ model: Schedule, as: "schedule" }, "start_time", "ASC"],
      ],
    });

    console.log("Fetched Timesheets:", timesheets.length);

    // Filter timesheets based on search criteria and other filters
    let filteredTimesheets = timesheets;

    // Apply filters
    if (search || fourNo || ges || contractor) {
      filteredTimesheets = timesheets.filter((timesheet) => {
        const schedule = timesheet.schedule;
        const employee = schedule?.Employee;
        const user = employee?.User;
        const event = schedule?.Event;
        const contractorClass = schedule?.ContractorClass;
        const assignment = contractorClass?.assignment;
        const contractorData = assignment?.Contractor;

        let passesFilters = true;

        // Search filter (first_name, last_name, event_name)
        if (search && search.trim()) {
          const matchesUser =
            user &&
            ((user.first_name &&
              user.first_name
                .toLowerCase()
                .includes(search.trim().toLowerCase())) ||
              (user.last_name &&
                user.last_name
                  .toLowerCase()
                  .includes(search.trim().toLowerCase())));

          const matchesEvent =
            event &&
            event.event_name &&
            event.event_name
              .toLowerCase()
              .includes(search.trim().toLowerCase());

          if (!(matchesUser || matchesEvent)) {
            passesFilters = false;
          }
        }

        // Four filter
        if (fourNo && fourNo.trim() && passesFilters) {
          const matchesFour =
            employee?.four &&
            employee.four.toLowerCase().includes(fourNo.trim().toLowerCase());
          if (!matchesFour) {
            passesFilters = false;
          }
        }

        // GES filter
        if (ges && ges.trim() && passesFilters) {
          const matchesGes =
            employee?.ges &&
            employee.ges.toLowerCase().includes(ges.trim().toLowerCase());
          if (!matchesGes) {
            passesFilters = false;
          }
        }

        // Contractor filter
        if (contractor && contractor.trim() && passesFilters) {
          const matchesContractor =
            contractorData?.company_name &&
            contractorData.company_name
              .toLowerCase()
              .includes(contractor.trim().toLowerCase());
          if (!matchesContractor) {
            passesFilters = false;
          }
        }

        return passesFilters;
      });
    }

    console.log("Filtered Timesheets:", filteredTimesheets.length);

    if (filteredTimesheets.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No timesheet data found for the specified date",
        data: [],
        total_events: 0,
      });
    }

    // Step 2: Group timesheets by Event -> Location -> Contractor hierarchy
    const groupedData = {};

    filteredTimesheets.forEach((timesheet, index) => {
      const schedule = timesheet.schedule;
      if (!schedule) {
        console.warn(`Skipping timesheet ${timesheet.id} - Schedule not found`);
        return;
      }

      const event = schedule.Event;
      if (!event) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - Event not found for schedule ${schedule.id}`,
        );
        return;
      }

      const contractorClass = schedule.ContractorClass;
      if (!contractorClass) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - ContractorClass not found for schedule ${schedule.id}`,
        );
        return;
      }

      const assignment = contractorClass.assignment;
      if (!assignment) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - Assignment not found for contractor class ${contractorClass.id}`,
        );
        return;
      }

      const eventLocation = assignment.EventLocation;
      if (!eventLocation) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - EventLocation not found for assignment ${assignment.id}`,
        );
        return;
      }

      const location = eventLocation.Location;
      if (!location) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - Location not found for event location ${eventLocation.id}`,
        );
        return;
      }

      const contractor = assignment.Contractor;
      if (!contractor) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - Contractor not found for assignment ${assignment.id}`,
        );
        return;
      }

      const classification = contractorClass.classification;
      if (!classification) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - Classification not found for contractor class ${contractorClass.id}`,
        );
        return;
      }

      const employee = schedule.Employee;
      if (!employee) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - Employee not found for schedule ${schedule.id}`,
        );
        return;
      }

      const user = employee.User;
      if (!user) {
        console.warn(
          `Skipping timesheet ${timesheet.id} - User not found for employee ${employee.id}`,
        );
        return;
      }

      // Create event group if doesn't exist
      if (!groupedData[event.id]) {
        groupedData[event.id] = {
          event_id: event.id,
          event_name: event.event_name,
          project_code: event.project_code,
          event_type: event.event_type,
          locations: {},
        };
      }

      // Create location group if doesn't exist
      if (!groupedData[event.id].locations[location.id]) {
        groupedData[event.id].locations[location.id] = {
          location_id: location.id,
          location_name: location.name,
          location_address: location.address_1,
          location_city: location.city,
          location_state: location.state,
          colour_code: location.colour_code,
          contractors: {},
        };
      }

      // Create contractor group if doesn't exist
      if (
        !groupedData[event.id].locations[location.id].contractors[contractor.id]
      ) {
        groupedData[event.id].locations[location.id].contractors[
          contractor.id
        ] = {
          contractor_id: contractor.id,
          contractor_name: `${contractor.first_name} ${contractor.last_name}`,
          company_name: contractor.company_name,
          contractor_email: contractor.email,
          contractor_status: contractor.status,
          employees: [],
        };
      }

      // Add employee timesheet data
      groupedData[event.id].locations[location.id].contractors[
        contractor.id
      ].employees.push({
        sn: index + 1, // Serial number
        employee_id: employee.id,
        employee_name: `${user.first_name} ${user.last_name}`,
        four: employee.four, // Added four attribute
        ges: employee.ges, // Added ges attribute
        classification: {
          id: classification.id,
          abbreviation: classification.abbreviation,
          description: classification.description,
        },
        start_time: schedule.start_time,
        timesheet: {
          id: timesheet.id,
          actual_start: timesheet.actual_start,
          end_time: timesheet.end_time,
          st: timesheet.st,
          ot: timesheet.ot,
          dt: timesheet.dt,
          status: timesheet.status,
          created_at: timesheet.created_at,
          updated_at: timesheet.updated_at,
        },
        schedule_id: schedule.id,
      });
    });

    // Step 3: Transform grouped data to flat array structure
    const transformedData = [];

    Object.values(groupedData).forEach((event) => {
      Object.values(event.locations).forEach((location) => {
        Object.values(location.contractors).forEach((contractor) => {
          transformedData.push({
            event_id: event.event_id,
            event_name: event.event_name,
            project_code: event.project_code,
            event_type: event.event_type,
            location_id: location.location_id,
            location_name: location.location_name,
            location_address: location.location_address,
            location_city: location.location_city,
            location_state: location.location_state,
            colour_code: location.colour_code,
            contractor_id: contractor.contractor_id,
            contractor_name: contractor.contractor_name,
            company_name: contractor.company_name,
            contractor_email: contractor.contractor_email,
            contractor_status: contractor.contractor_status,
            employees: contractor.employees,
            total_employees: contractor.employees.length,
          });
        });
      });
    });

    // Step 4: Apply sorting if requested
    if (
      sortBy &&
      ["event_name", "location_name", "company_name"].includes(sortBy)
    ) {
      const order = sortOrder === "desc" ? -1 : 1; // Default to ascending

      transformedData.sort((a, b) => {
        let valueA, valueB;

        if (sortBy === "event_name") {
          valueA = a.event_name || "";
          valueB = b.event_name || "";
        } else if (sortBy === "location_name") {
          valueA = a.location_name || "";
          valueB = b.location_name || "";
        } else if (sortBy === "company_name") {
          valueA = a.company_name || "";
          valueB = b.company_name || "";
        }

        // Case-insensitive string comparison
        const comparison = valueA
          .toLowerCase()
          .localeCompare(valueB.toLowerCase());
        return comparison * order;
      });
    }

    // Calculate timesheet status counts
    const timesheetCounts = {
      total: filteredTimesheets.length,
      open: filteredTimesheets.filter(
        (timesheet) => timesheet.status === "open",
      ).length,
      complete: filteredTimesheets.filter(
        (timesheet) => timesheet.status === "complete",
      ).length,
    };

    // Build filter summary for response message
    const appliedFilters = [];
    if (search && search.trim())
      appliedFilters.push(`search: "${search.trim()}"`);
    if (fourNo && fourNo.trim())
      appliedFilters.push(`fourNo: "${fourNo.trim()}"`);
    if (ges && ges.trim()) appliedFilters.push(`ges: "${ges.trim()}"`);
    if (contractor && contractor.trim())
      appliedFilters.push(`contractor: "${contractor.trim()}"`);

    const filterMessage =
      appliedFilters.length > 0
        ? ` (filtered by: ${appliedFilters.join(", ")})`
        : "";

    res.status(200).json({
      success: true,
      message: `Timesheet data retrieved successfully${filterMessage}`,
      data: transformedData,
      total_events: transformedData.length,
      total_timesheets: filteredTimesheets.length,
      timesheet_counts: timesheetCounts,
      filters_applied: {
        search: search && search.trim() ? search.trim() : null,
        fourNo: fourNo && fourNo.trim() ? fourNo.trim() : null,
        ges: ges && ges.trim() ? ges.trim() : null,
        contractor: contractor && contractor.trim() ? contractor.trim() : null,
      },
    });
  } catch (error) {
    console.error("Error fetching timesheet data:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateTimesheet = async (req, res) => {
  try {
    const { timesheetId } = req.params;
    const { actual_start, end_time, st, ot, dt, status } = req.body;

    // Validate timesheet ID
    if (!timesheetId || isNaN(timesheetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timesheet ID provided",
      });
    }

    // Find the timesheet
    const timesheet = await Timesheet.findByPk(timesheetId, {
      include: [
        {
          model: Schedule,
          as: "schedule",
          include: [
            {
              model: Employee,
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
          ],
        },
      ],
    });

    if (!timesheet) {
      return res.status(404).json({
        success: false,
        message: "Timesheet not found",
      });
    }

    // Prepare update data - only include fields that are provided
    const updateData = {};

    if (actual_start !== undefined) {
      updateData.actual_start = actual_start;
    }

    if (end_time !== undefined) {
      updateData.end_time = end_time;
    }

    if (st !== undefined) {
      // Validate st is a valid number
      if (isNaN(st) || st < 0) {
        return res.status(400).json({
          success: false,
          message: "Straight Time (st) must be a valid positive number",
        });
      }
      updateData.st = parseFloat(st);
    }

    if (ot !== undefined) {
      // Validate ot is a valid number
      if (isNaN(ot) || ot < 0) {
        return res.status(400).json({
          success: false,
          message: "Overtime (ot) must be a valid positive number",
        });
      }
      updateData.ot = parseFloat(ot);
    }

    if (dt !== undefined) {
      // Validate dt is a valid number
      if (isNaN(dt) || dt < 0) {
        return res.status(400).json({
          success: false,
          message: "Double Time (dt) must be a valid positive number",
        });
      }
      updateData.dt = parseFloat(dt);
    }

    if (status !== undefined) {
      // Validate status is either 'open' or 'complete'
      if (!["open", "complete"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'open' or 'complete'",
        });
      }
      updateData.status = status;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Update the timesheet
    await timesheet.update(updateData);

    // Fetch the updated timesheet with all related data
    const updatedTimesheet = await Timesheet.findByPk(timesheetId, {
      include: [
        {
          model: Schedule,
          as: "schedule",
          include: [
            {
              model: Employee,
              include: [
                {
                  model: User,
                  attributes: ["first_name", "last_name"],
                },
              ],
            },
            {
              model: Event,
              attributes: ["event_name", "project_code"],
            },
            {
              model: ContractorClass,
              include: [
                {
                  model: Classification,
                  as: "classification",
                  attributes: ["abbreviation", "description"],
                },
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Timesheet updated successfully",
      data: {
        timesheet: {
          id: updatedTimesheet.id,
          schedule_id: updatedTimesheet.schedule_id,
          actual_start: updatedTimesheet.actual_start,
          end_time: updatedTimesheet.end_time,
          st: updatedTimesheet.st,
          ot: updatedTimesheet.ot,
          dt: updatedTimesheet.dt,
          status: updatedTimesheet.status,
          total_hours:
            (updatedTimesheet.st || 0) +
            (updatedTimesheet.ot || 0) +
            (updatedTimesheet.dt || 0),
          created_at: updatedTimesheet.created_at,
          updated_at: updatedTimesheet.updated_at,
        },
        employee: {
          name: `${updatedTimesheet.schedule.Employee.User.first_name} ${updatedTimesheet.schedule.Employee.User.last_name}`,
        },
        event: {
          name: updatedTimesheet.schedule.Event.event_name,
          project_code: updatedTimesheet.schedule.Event.project_code,
        },
        classification: {
          abbreviation:
            updatedTimesheet.schedule.ContractorClass.classification
              .abbreviation,
          description:
            updatedTimesheet.schedule.ContractorClass.classification
              .description,
        },
        schedule_start_time: updatedTimesheet.schedule.start_time,
      },
    });
  } catch (error) {
    console.error("Error updating timesheet:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateBulkTimesheets = async (req, res) => {
  try {
    const { timesheets } = req.body;

    // Validate input
    if (!timesheets || !Array.isArray(timesheets) || timesheets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of timesheets to update",
      });
    }

    const updateResults = [];
    const errors = [];

    // Process each timesheet update
    for (let i = 0; i < timesheets.length; i++) {
      const timesheetData = timesheets[i];
      const { timesheetId, actual_start, end_time, st, ot, dt, status } =
        timesheetData;

      try {
        // Validate timesheet ID
        if (!timesheetId || isNaN(timesheetId)) {
          errors.push({
            index: i,
            timesheetId,
            error: "Invalid timesheet ID provided",
          });
          continue;
        }

        // Find the timesheet
        const timesheet = await Timesheet.findByPk(timesheetId);
        if (!timesheet) {
          errors.push({
            index: i,
            timesheetId,
            error: "Timesheet not found",
          });
          continue;
        }

        // Prepare update data - only include fields that are provided
        const updateData = {};

        if (actual_start !== undefined) {
          updateData.actual_start = actual_start;
        }

        if (end_time !== undefined) {
          updateData.end_time = end_time;
        }

        if (st !== undefined) {
          if (isNaN(st) || st < 0) {
            errors.push({
              index: i,
              timesheetId,
              error: "Straight Time (st) must be a valid positive number",
            });
            continue;
          }
          updateData.st = parseFloat(st);
        }

        if (ot !== undefined) {
          if (isNaN(ot) || ot < 0) {
            errors.push({
              index: i,
              timesheetId,
              error: "Overtime (ot) must be a valid positive number",
            });
            continue;
          }
          updateData.ot = parseFloat(ot);
        }

        if (dt !== undefined) {
          if (isNaN(dt) || dt < 0) {
            errors.push({
              index: i,
              timesheetId,
              error: "Double Time (dt) must be a valid positive number",
            });
            continue;
          }
          updateData.dt = parseFloat(dt);
        }

        if (status !== undefined) {
          if (!["open", "complete"].includes(status)) {
            errors.push({
              index: i,
              timesheetId,
              error: "Status must be either 'open' or 'complete'",
            });
            continue;
          }
          updateData.status = status;
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
          errors.push({
            index: i,
            timesheetId,
            error: "No valid fields provided for update",
          });
          continue;
        }

        // Update the timesheet
        await timesheet.update(updateData);

        updateResults.push({
          index: i,
          timesheetId,
          success: true,
          updatedFields: Object.keys(updateData),
        });
      } catch (updateError) {
        errors.push({
          index: i,
          timesheetId,
          error: updateError.message,
        });
      }
    }

    // Prepare response
    const response = {
      success: errors.length === 0,
      message:
        errors.length === 0
          ? "All timesheets updated successfully"
          : `${updateResults.length} timesheets updated successfully, ${errors.length} failed`,
      results: {
        successful_updates: updateResults.length,
        failed_updates: errors.length,
        total_processed: timesheets.length,
        updated_timesheets: updateResults,
      },
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    // Return appropriate status code
    const statusCode =
      errors.length === 0 ? 200 : updateResults.length > 0 ? 207 : 400;
    res.status(statusCode).json(response);
  } catch (error) {
    console.error("Error in bulk timesheet update:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getEventView = async (req, res) => {
  try {
    const { eventDate } = req.params;
    const { tab, search, sort_by, sort_order } = req.query;

    // Build where clause for schedule status filtering
    const whereClause = {
      is_deleted: false,
      [Op.and]: [where(fn("DATE", col("Schedule.start_time")), eventDate)],
    };

    // Filter by status if tab parameter is provided
    if (tab && ["pending", "confirmed", "declined"].includes(tab)) {
      whereClause.status = tab;
    }

    // Build user where clause for search filtering
    const userWhereClause = {};
    if (search) {
      userWhereClause[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Validate sort parameters
    const validSortFields = ["event_name", "location", "contractor"];
    const validSortOrders = ["asc", "desc"];
    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : "event_name";
    const sortDirection = validSortOrders.includes(sort_order)
      ? sort_order
      : "asc";

    // Step 1: Get all schedules for the specified date with all related data
    const schedules = await Schedule.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          attributes: ["id", "snf", "type"],
          required: !!search,
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name"],
              ...(search && { where: userWhereClause, required: true }),
            },
          ],
        },
        {
          model: Event,
          attributes: [
            "id",
            "event_name",
            "project_code",
            "project_comments",
            "start_date",
            "end_date",
          ],
        },
        {
          model: ContractorClass,
          attributes: [
            "id",
            "class_type",
            "start_time",
            "end_time",
            "need_number",
          ],
          include: [
            {
              model: Classification,
              as: "classification",
              attributes: [
                "id",
                "abbreviation",
                "description",
                "status",
                "order_number",
              ],
            },
            {
              model: EventLocationContractor,
              as: "assignment",
              attributes: ["id", "steward_id"],
              include: [
                {
                  model: Contractor,
                  attributes: [
                    "id",
                    "first_name",
                    "last_name",
                    "company_name",
                    "email",
                    "status",
                  ],
                },
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
                        "city",
                        "state",
                        "colour_code",
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      order: [["start_time", "ASC"]],
    });

    if (schedules.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No schedules found for the specified date",
        data: [],
        total_schedules: 0,
      });
    }

    // Step 2: Group schedules by Event -> Location -> Contractor -> Classification
    const groupedData = {};

    schedules.forEach((schedule) => {
      const event = schedule.Event;
      const contractorClass = schedule.ContractorClass;
      const assignment = contractorClass?.assignment;
      const contractor = assignment?.Contractor;
      const eventLocation = assignment?.EventLocation;
      const location = eventLocation?.Location;
      const classification = contractorClass?.classification;
      const employee = schedule.Employee;
      const user = employee?.User;

      if (
        !event ||
        !contractorClass ||
        !assignment ||
        !contractor ||
        !location ||
        !classification ||
        !employee ||
        !user
      ) {
        return; // Skip incomplete data
      }

      // Create event group if doesn't exist
      if (!groupedData[event.id]) {
        groupedData[event.id] = {
          event_id: event.id,
          event_name: event.event_name,
          project_code: event.project_code,
          project_comments: event.project_comments,
          event_start_date: event.start_date,
          event_end_date: event.end_date,
          locations: {},
        };
      }

      // Create location group if doesn't exist
      if (!groupedData[event.id].locations[location.id]) {
        groupedData[event.id].locations[location.id] = {
          event_location_id: eventLocation.id,
          location_id: location.id,
          location_name: location.name,
          location_address: location.address_1,
          location_city: location.city,
          location_state: location.state,
          colour_code: location.colour_code,
          contractors: {},
        };
      }

      // Create contractor group if doesn't exist
      if (
        !groupedData[event.id].locations[location.id].contractors[contractor.id]
      ) {
        groupedData[event.id].locations[location.id].contractors[
          contractor.id
        ] = {
          event_location_contractor_id: assignment.id,
          contractor_id: contractor.id,
          contractor_name: `${contractor.first_name} ${contractor.last_name}`,
          contractor_company: contractor.company_name,
          contractor_email: contractor.email,
          contractor_status: contractor.status,
          steward_id: assignment.steward_id,
          class_types: {
            regular: {},
            in: {},
            out: {},
          },
        };
      }

      const contractorGroup =
        groupedData[event.id].locations[location.id].contractors[contractor.id];
      const classType = contractorClass.class_type;

      // Create classification group if doesn't exist
      if (!contractorGroup.class_types[classType][classification.id]) {
        contractorGroup.class_types[classType][classification.id] = {
          contractor_class_id: contractorClass.id,
          classification_id: classification.id,
          classification_abbreviation: classification.abbreviation,
          classification_order: classification.order_number || null,
          classification_description: classification.description,
          classification_status: classification.status,
          start_time: contractorClass.start_time,
          end_time: contractorClass.end_time,
          need_number: contractorClass.need_number,
          schedules: {
            pending: 0,
            confirmed: 0,
            declined: 0,
          },
          scheduled_employees: [],
        };
      }

      const classGroup =
        contractorGroup.class_types[classType][classification.id];

      // Add schedule count
      classGroup.schedules[schedule.status]++;

      // Add employee to the scheduled list
      classGroup.scheduled_employees.push({
        schedule_id: schedule.id,
        employee_id: employee.id,
        employee_name: `${user.first_name} ${user.last_name}`,
        snf: employee.snf,
        type: employee.type,
        status: schedule.status,
        start_time: schedule.start_time,
        comments: schedule.comments,
        responded_at: schedule.responded_at,
      });
    });

    // Step 3: Transform to flat array structure
    const transformedData = [];

    Object.values(groupedData).forEach((event) => {
      Object.values(event.locations).forEach((location) => {
        Object.values(location.contractors).forEach((contractor) => {
          // Convert class_types object to arrays
          const classTypes = {
            regular: Object.values(contractor.class_types.regular),
            in: Object.values(contractor.class_types.in),
            out: Object.values(contractor.class_types.out),
          };

          // Only include if there are any schedules
          const hasSchedules =
            classTypes.regular.length > 0 ||
            classTypes.in.length > 0 ||
            classTypes.out.length > 0;

          if (hasSchedules) {
            transformedData.push({
              // Event details
              event_id: event.event_id,
              event_name: event.event_name,
              project_code: event.project_code,
              project_comments: event.project_comments,
              event_start_date: event.event_start_date,
              event_end_date: event.event_end_date,

              // Location details
              event_location_id: location.event_location_id,
              location_id: location.location_id,
              location_name: location.location_name,
              location_address: location.location_address,
              location_city: location.location_city,
              location_state: location.location_state,
              colour_code: location.colour_code,

              // Contractor details
              event_location_contractor_id:
                contractor.event_location_contractor_id,
              contractor_id: contractor.contractor_id,
              contractor_name: contractor.contractor_name,
              contractor_company: contractor.contractor_company,
              contractor_email: contractor.contractor_email,
              contractor_status: contractor.contractor_status,
              steward_id: contractor.steward_id,

              // Classes with individual schedules
              class_types: classTypes,
            });
          }
        });
      });
    });

    // Step 4: Apply sorting to transformed data
    transformedData.sort((a, b) => {
      let compareA, compareB;

      switch (sortField) {
        case "event_name":
          compareA = a.event_name?.toLowerCase() || "";
          compareB = b.event_name?.toLowerCase() || "";
          break;
        case "location":
          compareA = a.location_name?.toLowerCase() || "";
          compareB = b.location_name?.toLowerCase() || "";
          break;
        case "contractor":
          compareA = a.contractor_company?.toLowerCase() || "";
          compareB = b.contractor_company?.toLowerCase() || "";
          break;
        default:
          compareA = a.event_name?.toLowerCase() || "";
          compareB = b.event_name?.toLowerCase() || "";
      }

      if (sortDirection === "asc") {
        return compareA.localeCompare(compareB);
      } else {
        return compareB.localeCompare(compareA);
      }
    });

    res.status(200).json({
      success: true,
      message: "Event view data retrieved successfully",
      data: transformedData,
      total_items: transformedData.length,
      total_schedules: schedules.length,
      sort_by: sortField,
      sort_order: sortDirection,
    });
  } catch (error) {
    console.error("Error fetching event view data:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
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
  getScheduledEventList,
  getTimeSheetEventList,
  getTimesheetdata,
  updateTimesheet,
  updateBulkTimesheets,
  getEventView,
};
