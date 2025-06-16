"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("schedules", "start_time");

    await queryInterface.addColumn("schedules", "start_time", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("schedules", "start_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });
  },
};
