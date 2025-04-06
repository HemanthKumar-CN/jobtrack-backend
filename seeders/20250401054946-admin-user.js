"use strict";
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ Check if an admin already exists

    const adminExists = await queryInterface.sequelize.query(
      `SELECT * FROM users WHERE email = 'admin@mail.com';`,
    );

    if (adminExists[0].length == 0) {
      // ✅ Generate a secure password
      const tempPassword = "Admin@123"; // Change this after first login
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // ✅ Insert admin user
      await queryInterface.bulkInsert("users", [
        {
          first_name: "Admin",
          last_name: "User",
          email: "admin@mail.com",
          password: hashedPassword, // Store hashed password
          role_id: 1, // Assuming 1 = Admin
          image_url: null, // Optional
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      console.log("✅ Admin user inserted successfully.");
    } else {
      console.log("⚠️ Admin user already exists. Skipping...");
    }
  },

  async down(queryInterface, Sequelize) {
    // ✅ Remove the admin user if needed
    await queryInterface.bulkDelete("users", { email: "admin@mail.com" });
  },
};
