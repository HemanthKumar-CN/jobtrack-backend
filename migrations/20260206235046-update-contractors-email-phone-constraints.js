"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove unique constraint from email
    await queryInterface.removeConstraint(
      "Contractors",
      "Contractors_email_key",
    );

    // Change email to allow null and remove unique
    await queryInterface.changeColumn("Contractors", "email", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false,
    });

    // Change phone to allow null
    await queryInterface.changeColumn("Contractors", "phone", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert phone to not null
    await queryInterface.changeColumn("Contractors", "phone", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    // Revert email to not null and unique
    await queryInterface.changeColumn("Contractors", "email", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });
  },
};
