"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("restrictions", [
      {
        description: "Limited lifting capacity",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        description: "No physical limitations",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        description: "Restricted hours",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("restrictions", {
      description: {
        [Sequelize.Op.in]: [
          "Limited lifting capacity",
          "No physical limitations",
          "Restricted hours",
        ],
      },
    });
  },
};
