"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "time_off_reasons",
      [
        { name: "Deceased", created_at: new Date(), updated_at: new Date() },
        { name: "Retired", created_at: new Date(), updated_at: new Date() },
        {
          name: "Disciplinary",
          created_at: new Date(),
          updated_at: new Date(),
        },
        { name: "Suspended", created_at: new Date(), updated_at: new Date() },
        {
          name: "Probation Violation",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {},
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      "Timeoffreasons",
      {
        name: [
          "Deceased",
          "Retired",
          "Disciplinary",
          "Suspended",
          "Probation Violation",
        ],
      },
      {},
    );
  },
};
