"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("admin_configs", "timesheet_amount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.5,
      validate: {
        min: 0,
      },
      comment: "Amount per timesheet entry",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("admin_configs", "timesheet_amount");
  },
};
