"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("schedules", "timesheet_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "timesheets",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add index for better performance
    await queryInterface.addIndex("schedules", ["timesheet_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("schedules", ["timesheet_id"]);
    await queryInterface.removeColumn("schedules", "timesheet_id");
  },
};
