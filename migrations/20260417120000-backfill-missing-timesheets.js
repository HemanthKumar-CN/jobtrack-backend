"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Find all confirmed schedules that don't have a timesheet record
    const [confirmedSchedulesWithoutTimesheets] = await queryInterface.sequelize
      .query(`
      SELECT s.id as schedule_id
      FROM schedules s
      LEFT JOIN timesheets t ON s.id = t.schedule_id
      WHERE s.status = 'confirmed'
        AND s.is_deleted = false
        AND t.id IS NULL
    `);

    console.log(
      `Found ${confirmedSchedulesWithoutTimesheets.length} confirmed schedules without timesheets`,
    );

    if (confirmedSchedulesWithoutTimesheets.length === 0) {
      console.log("No missing timesheets to create. Skipping...");
      return;
    }

    // Create timesheet records for each confirmed schedule
    const timesheetRecords = confirmedSchedulesWithoutTimesheets.map(
      (schedule) => ({
        schedule_id: schedule.schedule_id,
        status: "open",
        st: 0,
        ot: 0,
        dt: 0,
        created_at: new Date(),
        updated_at: new Date(),
      }),
    );

    await queryInterface.bulkInsert("timesheets", timesheetRecords);

    console.log(
      `✅ Successfully created ${timesheetRecords.length} timesheet records for confirmed schedules`,
    );
  },

  async down(queryInterface, Sequelize) {
    // This is a data migration, reversing it would delete timesheets
    // Be careful with this - only use if you're sure you want to remove these timesheets
    console.log(
      "⚠️  Down migration: This will NOT delete the created timesheets for safety reasons.",
    );
    console.log(
      "If you need to reverse this, manually delete timesheets created by this migration.",
    );
  },
};
