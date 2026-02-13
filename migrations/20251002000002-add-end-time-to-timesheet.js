"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("timesheets", "end_time", {
      type: Sequelize.TIME,
      allowNull: true,
      comment: "Actual end time of work",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("timesheets", "end_time");
  },
};
