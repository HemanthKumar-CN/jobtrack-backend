"use strict";
const bcrypt = require("bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Reset roles sequence to avoid conflicts from previous failed attempts
    await queryInterface.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('roles', 'id'), MAX(id)) FROM roles;
    `);

    // 2. Insert SUPER_ADMIN role — skip if already exists (idempotent)
    await queryInterface.sequelize.query(`
      INSERT INTO roles (name, created_at, updated_at)
      VALUES ('SUPER_ADMIN', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING;
    `);

    // 2. Fetch the SUPER_ADMIN role id
    const [[superAdminRole]] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'SUPER_ADMIN';`,
    );

    // 3. Reset users sequence too (same reason)
    await queryInterface.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('users', 'id'), MAX(id)) FROM users;
    `);

    // 4. Create the super admin user — skip if already exists (idempotent)
    const hashedPassword = await bcrypt.hash("SuperAdmin@2026", 10);
    await queryInterface.sequelize.query(
      `
      INSERT INTO users (first_name, last_name, email, password, role_id, organization_id, image_url, created_at, updated_at)
      VALUES ('Super', 'Admin', 'superadmin@schedyl.com', :password, :roleId, NULL, NULL, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING;
    `,
      {
        replacements: { password: hashedPassword, roleId: superAdminRole.id },
      },
    );

    console.log(
      "✅ Super Admin migration done — email: superadmin@schedyl.com",
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE email = 'superadmin@schedyl.com';`,
    );
    await queryInterface.sequelize.query(
      `DELETE FROM roles WHERE name = 'SUPER_ADMIN';`,
    );
  },
};
