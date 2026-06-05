"use strict";

const { Organization, User, Employee, Role } = require("../models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendWelcomeEmail } = require("../utils/mailer");
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// ─── ORGANIZATIONS ──────────────────────────────────────────────────────────

exports.listOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.findAll({
      order: [["id", "ASC"]],
    });

    // Attach user counts
    const result = await Promise.all(
      orgs.map(async (org) => {
        const userCount = await User.count({
          where: { organization_id: org.id },
        });
        return { ...org.toJSON(), user_count: userCount };
      }),
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("listOrganizations error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createOrganization = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Organization name is required" });
    }

    const org = await Organization.create({ name: name.trim() });
    res.status(201).json({ success: true, data: org });
  } catch (error) {
    console.error("createOrganization error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const org = await Organization.findByPk(id);
    if (!org) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    if (name !== undefined) org.name = name.trim();
    if (status !== undefined) org.status = status;

    await org.save();
    res.json({ success: true, data: org });
  } catch (error) {
    console.error("updateOrganization error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    const org = await Organization.findByPk(id);
    if (!org) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    await org.destroy(); // paranoid soft delete
    res.json({ success: true, message: "Organization deleted" });
  } catch (error) {
    console.error("deleteOrganization error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── ORG USERS ───────────────────────────────────────────────────────────────

exports.listOrgUsers = async (req, res) => {
  try {
    const { orgId } = req.params;

    const org = await Organization.findByPk(orgId);
    if (!org) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    const users = await User.findAll({
      where: { organization_id: orgId },
      paranoid: false, // include soft-deleted so admin can see/restore
      include: [
        { model: Role, attributes: ["name"] },
        { model: Employee, attributes: ["id"], required: false },
      ],
      order: [["id", "ASC"]],
    });

    const result = users.map((u) => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      role: u.Role?.name ?? null,
      deleted_at: u.deleted_at,
      has_employee: !!u.Employee,
    }));

    res.json({ success: true, data: result, organization: org });
  } catch (error) {
    console.error("listOrgUsers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createOrgUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orgId } = req.params;
    const { firstName, lastName, email, roleName } = req.body;

    if (!firstName || !lastName || !email || !roleName) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "firstName, lastName, email, and roleName are required",
      });
    }

    const org = await Organization.findByPk(orgId, { transaction });
    if (!org) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    // Find the requested role
    const role = await Role.findOne({
      where: { name: roleName },
      transaction,
    });
    if (!role) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: `Role '${roleName}' not found` });
    }

    // Check email uniqueness
    const existing = await User.findOne({
      where: { email },
      paranoid: false,
      transaction,
    });
    if (existing) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Generate temp password
    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create user
    const newUser = await User.create(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        role_id: role.id,
        organization_id: parseInt(orgId),
      },
      { transaction },
    );

    // If role is EMPLOYEE, also create employee record
    if (roleName === "EMPLOYEE") {
      await Employee.create(
        {
          user_id: newUser.id,
          organization_id: parseInt(orgId),
          type: "A-List",
          status: "active",
        },
        { transaction },
      );
    }

    await transaction.commit();

    // Send welcome email (non-blocking — don't fail the request if email fails)
    try {
      await sendWelcomeEmail(email, firstName, tempPassword);
    } catch (emailErr) {
      console.error("Welcome email failed (non-fatal):", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: "User created and welcome email sent",
      data: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: roleName,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("createOrgUser error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateOrgUser = async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const { roleName } = req.body;

    const user = await User.findOne({
      where: { id: userId, organization_id: orgId },
      paranoid: false,
    });
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User not found in this organization",
        });
    }

    if (roleName) {
      const role = await Role.findOne({ where: { name: roleName } });
      if (!role) {
        return res
          .status(400)
          .json({ success: false, message: `Role '${roleName}' not found` });
      }
      user.role_id = role.id;
    }

    // Restore soft-deleted user if requested
    if (user.deleted_at) {
      await user.restore();
    }

    await user.save();
    res.json({ success: true, message: "User updated" });
  } catch (error) {
    console.error("updateOrgUser error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteOrgUser = async (req, res) => {
  try {
    const { orgId, userId } = req.params;

    const user = await User.findOne({
      where: { id: userId, organization_id: orgId },
    });
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User not found in this organization",
        });
    }

    await user.destroy(); // paranoid soft delete
    res.json({ success: true, message: "User disabled" });
  } catch (error) {
    console.error("deleteOrgUser error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
