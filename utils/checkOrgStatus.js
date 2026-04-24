const { Organization } = require("../models");

exports.checkOrgStatus = async (req, res, next) => {
  try {
    // SUPER_ADMIN and users with no organization bypass this check
    if (
      req.user.roleName === "SUPER_ADMIN" ||
      req.user.organizationId === null ||
      req.user.organizationId === undefined
    ) {
      return next();
    }

    const org = await Organization.findByPk(req.user.organizationId);

    if (!org || org.status === "inactive") {
      return res.status(403).json({
        message:
          "Your organization account is currently suspended. Please contact support.",
      });
    }

    next();
  } catch (error) {
    console.error("checkOrgStatus error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
