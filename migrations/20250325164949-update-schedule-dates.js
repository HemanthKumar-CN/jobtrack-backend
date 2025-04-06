"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("schedules", "start_date", {
      type: Sequelize.DATE, // Change from DATEONLY to DATE
      allowNull: false,
    });

    await queryInterface.changeColumn("schedules", "end_date", {
      type: Sequelize.DATE, // Change from DATEONLY to DATE
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("schedules", "start_date", {
      type: Sequelize.DATEONLY, // Revert back to DATEONLY
      allowNull: false,
    });

    await queryInterface.changeColumn("schedules", "end_date", {
      type: Sequelize.DATEONLY, // Revert back to DATEONLY
      allowNull: false,
    });
  },
};
