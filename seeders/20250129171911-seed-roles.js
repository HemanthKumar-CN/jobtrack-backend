"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("roles", [
      { name: "ADMIN", created_at: new Date(), updated_at: new Date() },
      { name: "MANAGER", created_at: new Date(), updated_at: new Date() },
      { name: "EMPLOYEE", created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("roles", null, {});
  },
};
