"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("event_location_contractors", "start_time", {
      type: Sequelize.DATE,
      allowNull: false,
    });

    await queryInterface.addColumn("event_location_contractors", "end_time", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "event_location_contractors",
      "start_time",
    );
    await queryInterface.removeColumn("event_location_contractors", "end_time");
  },
};
