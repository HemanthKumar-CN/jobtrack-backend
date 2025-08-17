"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("locations", "location_id_import", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("Contractors", "contractor_id_import", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("Contractors", "comments", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove new columns
    await queryInterface.removeColumn("Location", "location_id_import");

    await queryInterface.removeColumn("Contractor", "contractor_id_import");

    await queryInterface.removeColumn("Contractor", "comments");
  },
};
