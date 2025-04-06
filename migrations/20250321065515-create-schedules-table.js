"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("schedules", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      task_event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Events", // Linking to Events table
          key: "id",
        },
        onDelete: "CASCADE",
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATEONLY, // YYYY-MM-DD format
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATEONLY, // YYYY-MM-DD format
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TIME, // HH:MM:SS format
        allowNull: false,
      },
      end_time: {
        type: Sequelize.TIME, // HH:MM:SS format
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("scheduled", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "scheduled",
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("schedules");
  },
};
