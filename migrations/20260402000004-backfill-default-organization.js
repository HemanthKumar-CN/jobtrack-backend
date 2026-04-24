"use strict";

/**
 * This migration creates a default Organization record from the existing
 * admin_configs.organization name (set by the admin before multi-tenancy),
 * then assigns ALL existing data rows to that organization.
 *
 * SUPER_ADMIN users are excluded — they stay with organization_id = NULL.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Get the organization name from admin_configs (first record)
    const [adminConfigs] = await queryInterface.sequelize.query(
      `SELECT organization FROM admin_configs WHERE organization IS NOT NULL AND organization != '' LIMIT 1;`,
    );
    const orgName =
      adminConfigs.length > 0 ? adminConfigs[0].organization : "Default Organization";

    // 2. Create the default organization (skip if one already exists)
    const [existingOrgs] = await queryInterface.sequelize.query(
      `SELECT id FROM organizations LIMIT 1;`,
    );

    let orgId;
    if (existingOrgs.length > 0) {
      orgId = existingOrgs[0].id;
      console.log(`✅ Using existing organization id=${orgId}`);
    } else {
      await queryInterface.sequelize.query(`
        INSERT INTO organizations (name, status, created_at, updated_at)
        VALUES (:name, 'active', NOW(), NOW());
      `, { replacements: { name: orgName } });

      const [[newOrg]] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations WHERE name = :name LIMIT 1;`,
        { replacements: { name: orgName } },
      );
      orgId = newOrg.id;
      console.log(`✅ Created default organization "${orgName}" id=${orgId}`);
    }

    // 3. Backfill all tables — exclude SUPER_ADMIN users
    const [[superAdminRole]] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'SUPER_ADMIN';`,
    ).catch(() => [[null]]);

    const superAdminRoleId = superAdminRole ? superAdminRole.id : null;

    // users (skip SUPER_ADMIN)
    await queryInterface.sequelize.query(`
      UPDATE users
      SET organization_id = :orgId
      WHERE organization_id IS NULL
        ${superAdminRoleId ? "AND role_id != :superAdminRoleId" : ""};
    `, { replacements: { orgId, superAdminRoleId } });

    // employees
    await queryInterface.sequelize.query(`
      UPDATE employees SET organization_id = :orgId WHERE organization_id IS NULL;
    `, { replacements: { orgId } });

    // locations
    await queryInterface.sequelize.query(`
      UPDATE locations SET organization_id = :orgId WHERE organization_id IS NULL;
    `, { replacements: { orgId } });

    // Contractors (capital C — actual table name)
    await queryInterface.sequelize.query(`
      UPDATE "Contractors" SET organization_id = :orgId WHERE organization_id IS NULL;
    `, { replacements: { orgId } });

    // Events (capital E — actual table name)
    await queryInterface.sequelize.query(`
      UPDATE "Events" SET organization_id = :orgId WHERE organization_id IS NULL;
    `, { replacements: { orgId } });

    // restrictions
    await queryInterface.sequelize.query(`
      UPDATE restrictions SET organization_id = :orgId WHERE organization_id IS NULL;
    `, { replacements: { orgId } });

    // classifications
    await queryInterface.sequelize.query(`
      UPDATE classifications SET organization_id = :orgId WHERE organization_id IS NULL;
    `, { replacements: { orgId } });

    // admin_configs
    await queryInterface.sequelize.query(`
      UPDATE admin_configs SET organization_id = :orgId WHERE organization_id IS NULL;
    `, { replacements: { orgId } });

    // schedules
    await queryInterface.sequelize.query(`
      UPDATE schedules SET organization_id = :orgId WHERE organization_id IS NULL;
    `, { replacements: { orgId } });

    console.log(`✅ Backfill complete — all existing data assigned to organization id=${orgId} ("${orgName}")`);
  },

  async down(queryInterface, Sequelize) {
    // Nullify all organization_id columns (reverse of backfill)
    await queryInterface.sequelize.query(`UPDATE users SET organization_id = NULL;`);
    await queryInterface.sequelize.query(`UPDATE employees SET organization_id = NULL;`);
    await queryInterface.sequelize.query(`UPDATE locations SET organization_id = NULL;`);
    await queryInterface.sequelize.query(`UPDATE "Contractors" SET organization_id = NULL;`);
    await queryInterface.sequelize.query(`UPDATE "Events" SET organization_id = NULL;`);
    await queryInterface.sequelize.query(`UPDATE restrictions SET organization_id = NULL;`);
    await queryInterface.sequelize.query(`UPDATE classifications SET organization_id = NULL;`);
    await queryInterface.sequelize.query(`UPDATE admin_configs SET organization_id = NULL;`);
    await queryInterface.sequelize.query(`UPDATE schedules SET organization_id = NULL;`);

    // Delete the default organization
    await queryInterface.sequelize.query(`DELETE FROM organizations;`);
  },
};
