"use strict";

const express = require("express");
const router = express.Router();
const { authenticateSuperAdmin } = require("../utils/authenticateSuperAdmin");
const {
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  listOrgUsers,
  createOrgUser,
  updateOrgUser,
  deleteOrgUser,
} = require("../controllers/superAdminController");

// All routes require SUPER_ADMIN role
router.use(authenticateSuperAdmin);

// Organizations
router.get("/organizations", listOrganizations);
router.post("/organizations", createOrganization);
router.put("/organizations/:id", updateOrganization);
router.delete("/organizations/:id", deleteOrganization);

// Org users
router.get("/organizations/:orgId/users", listOrgUsers);
router.post("/organizations/:orgId/users", createOrgUser);
router.put("/organizations/:orgId/users/:userId", updateOrgUser);
router.delete("/organizations/:orgId/users/:userId", deleteOrgUser);

module.exports = router;
