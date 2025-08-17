"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("event_location_contractors", "type", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.removeColumn(
      "event_location_contractors",
      "start_time",
    );
    await queryInterface.removeColumn("event_location_contractors", "end_time");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("event_location_contractors", "type");

    await queryInterface.addColumn("event_location_contractors", "start_time", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("event_location_contractors", "end_time", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
