"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("time_off_reasons", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.bulkInsert("time_off_reasons", [
      { name: "Vacation", created_at: new Date(), updated_at: new Date() },
      { name: "Medical Leave", created_at: new Date(), updated_at: new Date() },
      { name: "Personal Day", created_at: new Date(), updated_at: new Date() },
      {
        name: "Family Emergency",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Public Holiday",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("time_off_reasons");
  },
};
