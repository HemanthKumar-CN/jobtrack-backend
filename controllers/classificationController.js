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

const updateClassification = async (req, res) => {
  const { id } = req.params;
  const { description, abbreviation, status } = req.body;

  try {
    const classification = await Classification.findByPk(id);
    if (!classification) {
      return res.status(404).json({ message: "Classification not found" });
    }

    classification.description = description || classification.description;
    classification.abbreviation = abbreviation || classification.abbreviation;
    classification.status = status || classification.status;

    await classification.save();
    res.status(200).json(classification);
  } catch (error) {
    console.error("Error updating classification:", error);
    res.status(500).json({ message: "Failed to update classification" });
  }
};

module.exports = {
  getAllClassifications,
  updateClassification,
};
