// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");

// const Role = sequelize.define(
//   "Role",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       allowNull: false,
//       primaryKey: true,
//     },
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//   },
//   {
//     tableName: "roles",
//     timestamps: true,
//     underscored: true,
//   },
// );

// module.exports = Role;

"use strict";

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define(
    "Role",
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
        unique: true,
      },
    },
    {
      tableName: "roles",
      timestamps: true,
      underscored: true,
    },
  );

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: "role_id" });
  };

  return Role;
};
