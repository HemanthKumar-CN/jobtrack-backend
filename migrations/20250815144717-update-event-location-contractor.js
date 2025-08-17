"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("event_location_contractors", "type");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("event_location_contractors", "type", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
