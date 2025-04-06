"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("schedules", "start_time");
    await queryInterface.removeColumn("schedules", "end_time");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("schedules", "start_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });

    await queryInterface.addColumn("schedules", "end_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });
  },
};
