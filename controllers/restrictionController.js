const { Op } = require("sequelize");
const { Restriction } = require("../models");

const getAllRestrictions = async (req, res) => {
  try {
    const {
      status = "all",
      search = "",
      restrictionName = "",
      type = "",
      sortField = "description",
      sortOrder = "asc",
    } = req.query;

    // 🔍 Build dynamic where condition
    let where = {};

    // 🔸 Filter by status (only if not 'all')
    if (status !== "") {
      where.status = status;
    }

    // 🔸 Search by description
    if (search.trim() !== "") {
      where.description = {
        [Op.iLike]: `%${search.trim()}%`,
      };
    }

    // 🔸 Filter by restrictionName (match description OR type)
    if (restrictionName.trim() !== "") {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${restrictionName.trim()}%` } },
        { type: { [Op.iLike]: `%${restrictionName.trim()}%` } },
      ];
    }

    // 🔸 Filter by type (explicit dropdown filter)
    if (type.trim() !== "") {
      where.type = type;
    }

    // ✅ Safe sortField check (prevent SQL injection)
    const validFields = [
      "id",
      "description",
      "status",
      "created_at",
      "updated_at",
    ];
    const orderField = validFields.includes(sortField)
      ? sortField
      : "description";

    const orderDirection = ["asc", "desc"].includes(sortOrder.toLowerCase())
      ? sortOrder.toUpperCase()
      : "ASC";

    const restrictions = await Restriction.findAll({
      where,
      order: [[orderField, orderDirection]],
    });

    res.status(200).json(restrictions);
  } catch (error) {
    console.error("Error fetching restrictions:", error);
    res.status(500).json({ message: "Failed to fetch restrictions" });
  }
};

const bulkCreate = async (req, res) => {
  const { restrictions } = req.body;

  if (!Array.isArray(restrictions) || restrictions.length === 0) {
    return res.status(400).json({ message: "No restrictions provided." });
  }

  try {
    const newRestrictions = await Restriction.bulkCreate(restrictions);
    return res
      .status(201)
      .json({ message: "Created successfully", restrictions: newRestrictions });
  } catch (err) {
    console.error("Bulk Create Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateRestriction = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, status, type } = req.body;

    const restriction = await Restriction.findByPk(id);
    if (!restriction) {
      return res.status(404).json({ message: "Restriction not found" });
    }

    restriction.description = description;
    restriction.status = status;
    restriction.type = type;
    await restriction.save();

    res.json(restriction);
  } catch (error) {
    console.error("Error updating restriction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllRestrictions,
  bulkCreate,
  updateRestriction,
};
