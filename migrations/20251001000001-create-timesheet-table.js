"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("timesheets", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      schedule_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "schedules",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      actual_start: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: "Actual start time of work",
      },
      st: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "Straight Time hours",
      },
      ot: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "Overtime hours",
      },
      dt: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "Double Time hours",
      },
      status: {
        type: Sequelize.ENUM("open", "complete"),
        allowNull: false,
        defaultValue: "open",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add index on schedule_id for better performance
    await queryInterface.addIndex("timesheets", ["schedule_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("timesheets");
  },
};
