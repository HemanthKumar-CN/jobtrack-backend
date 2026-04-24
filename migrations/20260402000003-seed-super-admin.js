"use strict";
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Insert SUPER_ADMIN role if it doesn't already exist
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'SUPER_ADMIN';`,
    );
    if (roles.length === 0) {
      await queryInterface.bulkInsert("roles", [
        {
          name: "SUPER_ADMIN",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // 2. Fetch the SUPER_ADMIN role id (auto-assigned)
    const [[superAdminRole]] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'SUPER_ADMIN';`,
    );

    // 3. Create the super admin user if not already present
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'superadmin@schedyl.com';`,
    );
    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash("SuperAdmin@2026", 10);
      await queryInterface.bulkInsert("users", [
        {
          first_name: "Super",
          last_name: "Admin",
          email: "superadmin@schedyl.com",
          password: hashedPassword,
          role_id: superAdminRole.id,
          organization_id: null,
          image_url: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      console.log(
        "✅ Super Admin created — email: superadmin@schedyl.com  password: SuperAdmin@2026",
      );
    } else {
      console.log("⚠️ Super Admin already exists. Skipping...");
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "users",
      { email: "superadmin@schedyl.com" },
      {},
    );
    await queryInterface.bulkDelete("roles", { name: "SUPER_ADMIN" }, {});
  },
};
