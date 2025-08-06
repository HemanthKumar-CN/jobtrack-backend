const { Classification } = require("../models");
const { Op } = require("sequelize");

const getAllClassifications = async (req, res) => {
  const { status = "", search = "" } = req.query;

  const where = {};

  if (status && ["active", "inactive"].includes(status)) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { description: { [Op.iLike]: `%${search}%` } },
      { abbreviation: { [Op.iLike]: `%${search}%` } },
    ];
  }

  try {
    const classifications = await Classification.findAll({
      where,
      order: [["description", "ASC"]],
    });
    res.status(200).json(classifications);
  } catch (error) {
    console.error("Error fetching classifications:", error);
    res.status(500).json({ message: "Failed to fetch classifications" });
  }
};

module.exports = {
  getAllClassifications,
};
