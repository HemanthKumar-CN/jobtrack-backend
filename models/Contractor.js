"use strict";

module.exports = (sequelize, DataTypes) => {
  const Contractor = sequelize.define(
    "Contractor",
    {
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      company_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      hourly_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      address_1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address_2: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_employer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      zip: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "Contractors",
      timestamps: true,
      underscored: true,
    },
  );

  Contractor.associate = (models) => {
    Contractor.hasMany(models.EventLocationContractor, {
      foreignKey: "contractor_id",
    });
  };

  return Contractor;
};
