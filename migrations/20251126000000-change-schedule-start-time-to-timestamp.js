"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change start_time column to TIMESTAMP WITHOUT TIME ZONE
    await queryInterface.sequelize.query(`
      ALTER TABLE schedules 
      ALTER COLUMN start_time TYPE TIMESTAMP WITHOUT TIME ZONE 
      USING start_time AT TIME ZONE 'UTC';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to TIMESTAMP WITH TIME ZONE if needed
    await queryInterface.sequelize.query(`
      ALTER TABLE schedules 
      ALTER COLUMN start_time TYPE TIMESTAMP WITH TIME ZONE 
      USING start_time AT TIME ZONE 'UTC';
    `);
  },
};
