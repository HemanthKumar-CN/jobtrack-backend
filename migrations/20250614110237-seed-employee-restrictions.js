"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch all employee IDs
    const employees = await queryInterface.sequelize.query(
      "SELECT id FROM employees;",
      { type: Sequelize.QueryTypes.SELECT },
    );

    // Prepare insert rows with restriction_id = 2
    const employeeRestrictions = employees.map((employee) => ({
      employee_id: employee.id,
      restriction_id: 2, // "No physical limitations"
      created_at: new Date(),
      updated_at: new Date(),
    }));

    // Bulk insert
    if (employeeRestrictions.length > 0) {
      await queryInterface.bulkInsert(
        "employee_restrictions",
        employeeRestrictions,
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("employee_restrictions", {
      restriction_id: 2,
    });
  },
};
