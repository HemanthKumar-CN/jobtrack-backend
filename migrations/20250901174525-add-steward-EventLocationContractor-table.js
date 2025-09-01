"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("event_location_contractors", "steward_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "employees",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL", // if employee deleted, steward_id becomes null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      "event_location_contractors",
      "steward_id",
    );
  },
};
