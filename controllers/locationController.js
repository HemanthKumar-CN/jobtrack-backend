const path = require("path");
const Location = require("../models/Location");

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
    const locations = await Location.findAll();
    res.status(200).json(locations);
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
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
};
