// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");
// const EventLocationContractor = require("./EventLocationContractor");

// const Contractor = sequelize.define(
//   "Contractor",
//   {
//     first_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     last_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     company_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     email: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//     address_1: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     address_2: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     city: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     state: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     zip: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     phone: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//   },
//   {
//     tableName: "Contractors",
//     timestamps: true,
//     underscored: true,
//   },
// );

// Contractor.hasMany(EventLocationContractor, { foreignKey: "contractor_id" });

// module.exports = Contractor;

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
        allowNull: false,
        unique: true,
      },
      address_1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address_2: {
        type: DataTypes.STRING,
        allowNull: true,
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
        allowNull: false,
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
