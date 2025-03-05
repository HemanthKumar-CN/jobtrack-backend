const Employee = require("../models/Employee");
const User = require("../models/User");

exports.createEmployee = async (req, res) => {
  try {
    const {
      user_id,
      address_1,
      address_2,
      city,
      state,
      postal_code,
      phone,
      status,
      position,
      date_of_birth,
      hire_date,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    // Check if the user exists
    const userExists = await User.findByPk(user_id);
    if (!userExists) {
      return res.status(400).json({ message: "User not found" });
    }

    const newEmployee = await Employee.create({
      user_id,
      address_1,
      address_2,
      city,
      state,
      postal_code,
      phone,
      status,
      position,
      date_of_birth,
      hire_date,
      emergency_contact_name,
      emergency_contact_phone,
    });

    res
      .status(201)
      .json({
        message: "Employee created successfully",
        employee: newEmployee,
      });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({ include: User });
    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, { include: User });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.update(updatedData);
    res
      .status(200)
      .json({ message: "Employee updated successfully", employee });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Soft Delete (Just updates status to 'inactive')
exports.softDeleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.update({ status: "inactive" });
    res.status(200).json({ message: "Employee soft deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
