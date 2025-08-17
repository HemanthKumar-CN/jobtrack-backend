"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("contractor_classes", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "event_location_contractors",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      classification_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "classifications", // new table for the list you provided
          key: "id",
        },
        onDelete: "CASCADE",
      },
      class_type: {
        type: Sequelize.STRING, // Regular, In, Out
        allowNull: false,
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("contractor_classes");
  },
};
