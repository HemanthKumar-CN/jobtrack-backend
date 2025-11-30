const { Op } = require("sequelize");
const { Contractor } = require("../models");

// Get all contractors
const getAllContractors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
      search = "",
      sortField = "id",
      sortOrder = "ASC",
      status = "",
      companyName = "",
      city = "",
      state = "",
      phone = "",
    } = req.query;
    const offset = (page - 1) * limit;

    // Build order dynamically
    const allowedSortFields = ["company_name", "city", "state", "id"];
    const order = allowedSortFields.includes(sortField)
      ? [[sortField, sortOrder.toUpperCase()]]
      : [["id", "ASC"]]; // default order

    const whereClause = search
      ? {
          company_name: { [Op.iLike]: `%${search}%` }, // Case-insensitive search
        }
      : {};

    if (status && ["active", "inactive"].includes(status)) {
      whereClause.status = status;
    }

    if (companyName) {
      whereClause.company_name = { [Op.iLike]: `%${companyName}%` };
    }
    if (city) {
      whereClause.city = { [Op.iLike]: `%${city}%` };
    }
    if (state) {
      whereClause.state = { [Op.iLike]: `%${state}%` };
    }
    if (phone) {
      whereClause.phone = { [Op.iLike]: `%${phone}%` };
    }

    const contractors = await Contractor.findAll({
      where: whereClause,
      // limit: parseInt(limit),
      // offset: parseInt(offset),
      order,
    });

    console.log(contractors, "?//////////////=---");

    const total = await Contractor.count({ where: whereClause });

    res.status(200).json({
      contractors,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.log(error, "}}}ERR");
    res.status(500).json({ error: "Server error" });
  }
};

const getContractsDropdown = async (req, res) => {
  try {
    const contractors = await Contractor.findAll({
      where: { status: "active" },
      attributes: ["id", "company_name"], // Fetch only id & company_name
      order: [["id", "ASC"]],
    });

    res.status(200).json({ contractors });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new contractor
const createContractor = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      company_name,
      email,
      address_1,
      address_2,
      is_employer,
      city,
      state,
      status,
      zip,
      phone,
      hourly_rate,
    } = req.body;

    console.log(req.body);

    // Check for required fields
    if (
      !first_name ||
      !last_name ||
      !company_name ||
      !email ||
      !city ||
      !phone
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled" });
    }

    const contractor = await Contractor.create({
      first_name,
      last_name,
      company_name,
      email,
      address_1,
      address_2,
      is_employer,
      city,
      state,
      zip,
      status,
      phone,
      hourly_rate,
      created_at: new Date(), // Ensure created_at is set
      updated_at: new Date(),
    });

    res.status(201).json(contractor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllContractorsWhoAreEmployers = async (req, res) => {
  try {
    const employers = await Contractor.findAll({
      where: { is_employer: true },
      attributes: ["id", "company_name"],
      order: [["company_name", "ASC"]],
    });
    res.status(200).json({ employers });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update a contractor by ID
const updateContractorById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      company_name,
      email,
      address_1,
      address_2,
      is_employer,
      city,
      state,
      zip,
      status,
      hourly_rate,
      phone,
    } = req.body;

    const contractor = await Contractor.findByPk(id);
    if (!contractor) {
      return res.status(404).json({ error: "Contractor not found" });
    }

    // Update fields only if new values are provided
    contractor.first_name = first_name;
    contractor.last_name = last_name;
    contractor.company_name = company_name;
    contractor.email = email;
    contractor.address_1 = address_1;
    contractor.address_2 = address_2;
    contractor.is_employer = is_employer;
    contractor.city = city;
    contractor.state = state;
    contractor.zip = zip;
    contractor.phone = phone;
    contractor.status = status;
    contractor.hourly_rate = hourly_rate;

    contractor.updated_at = new Date(); // Ensure updated_at is set

    await contractor.save();
    res.status(200).json(contractor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Contractor by ID
const getContractorById = async (req, res) => {
  try {
    const contractor = await Contractor.findByPk(req.params.id);
    if (!contractor)
      return res.status(404).json({ message: "Contractor not found" });
    res.json(contractor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contractor", error });
  }
};

// Delete Contractor
const deleteContractor = async (req, res) => {
  try {
    const deleted = await Contractor.destroy({ where: { id: req.params.id } });
    if (!deleted)
      return res.status(404).json({ message: "Contractor not found" });
    res.json({ message: "Contractor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting contractor", error });
  }
};

module.exports = {
  getAllContractors,
  createContractor,
  updateContractorById,
  getContractorById,
  deleteContractor,
  getContractsDropdown,
  getAllContractorsWhoAreEmployers,
};
