"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("schedules", "start_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });
    await queryInterface.addColumn("schedules", "end_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });

    // Change start_date and end_date to store only DATE
    await queryInterface.changeColumn("schedules", "start_date", {
      type: Sequelize.DATEONLY, // Stores only YYYY-MM-DD
      allowNull: false,
    });

    await queryInterface.changeColumn("schedules", "end_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("schedules", "start_time");
    await queryInterface.removeColumn("schedules", "end_time");

    // Revert start_date and end_date back to TIMESTAMPZ
    await queryInterface.changeColumn("schedules", "start_date", {
      type: Sequelize.DATE, // Reverts to DATE with time
      allowNull: false,
    });

    await queryInterface.changeColumn("schedules", "end_date", {
      type: Sequelize.DATE, // Reverts to DATE with time
      allowNull: false,
    });
  },
};
