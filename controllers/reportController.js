const Employee = require("../models/Employee");
const Location = require("../models/Location");
const User = require("../models/User");

exports.getEmployeeAndLocations = async (req, res) => {
  try {
    // Fetch employees with associated users
    const employees = await Employee.findAll({
      include: [
        {
          model: User,
          attributes: ["first_name", "last_name"],
        },
      ],
      attributes: ["id"], // employee table ID
    });

    const employeeList = employees.map((emp) => ({
      id: emp.id,
      name: emp.User.first_name + " " + emp.User.last_name,
    }));

    // Fetch locations
    const locations = await Location.findAll({
      attributes: ["id", "name"],
    });

    res.json({
      success: true,
      data: {
        employees: employeeList,
        locations,
      },
    });
  } catch (error) {
    console.error("Error fetching metadata:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
