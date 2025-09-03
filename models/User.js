// const { DataTypes } = require("sequelize");
// const Role = require("./Role");
// const sequelize = require("../config/database");

// const User = sequelize.define(
//   "User",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       allowNull: false,
//       primaryKey: true,
//     },
//     first_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     last_name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     image_url: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     email: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//     },
//     password: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     role_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "roles",
//         key: "id",
//       },
//     },
//     deleted_at: {
//       type: DataTypes.DATE,
//       allowNull: true,
//     },
//   },
//   {
//     tableName: "users",
//     timestamps: true,
//     underscored: true,
//   },
// );

// User.belongsTo(Role, { foreignKey: "role_id" });

// module.exports = User;

"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      underscored: true,
      paranoid: true, // ✅ enable soft delete
      deletedAt: "deleted_at", // ✅ match your column name
    },
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: "role_id" });
    User.hasOne(models.Employee, { foreignKey: "user_id" });
    User.hasOne(models.AdminConfig, { foreignKey: "user_id" });
  };

  return User;
};
