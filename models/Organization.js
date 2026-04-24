"use strict";

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    "Organization",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "organizations",
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );

  Organization.associate = (models) => {
    Organization.hasMany(models.User, { foreignKey: "organization_id" });
    Organization.hasMany(models.Location, { foreignKey: "organization_id" });
    Organization.hasMany(models.Contractor, { foreignKey: "organization_id" });
    Organization.hasMany(models.Event, { foreignKey: "organization_id" });
    Organization.hasMany(models.Restriction, { foreignKey: "organization_id" });
    Organization.hasMany(models.Classification, {
      foreignKey: "organization_id",
    });
    Organization.hasMany(models.AdminConfig, { foreignKey: "organization_id" });
  };

  return Organization;
};
