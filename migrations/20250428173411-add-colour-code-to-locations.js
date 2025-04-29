"use strict";

const Location = require("../models/Location");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("locations", "colour_code", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    const locations = await Location.findAll({
      attributes: ["id"],
      raw: true,
    });

    function generateVibrantColor() {
      while (true) {
        const color =
          "#" +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0");
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        if (brightness > 30 && brightness < 220) {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min > 30) {
            return color;
          }
        }
      }
    }

    for (const location of locations) {
      const vibrantColor = generateVibrantColor();
      await Location.update(
        { colour_code: vibrantColor },
        { where: { id: location.id } },
      );
    }

    await queryInterface.changeColumn("locations", "colour_code", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("locations", "colour_code");
  },
};
