"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove old column
    await queryInterface.removeColumn("time_offs", "name");

    // Add reason_id
    await queryInterface.addColumn("time_offs", "reason_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "time_off_reasons",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes
    await queryInterface.removeColumn("time_offs", "reason_id");

    await queryInterface.addColumn("time_offs", "name", {
      type: Sequelize.STRING,
    });
  },
};
