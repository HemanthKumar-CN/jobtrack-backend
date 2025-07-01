// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");
// const User = require("./User");

// const Employee = sequelize.define(
//   "Employee",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       allowNull: false,
//       primaryKey: true,
//     },
//     user_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "users",
//         key: "id",
//       },
//     },
//     address_1: {
//       type: DataTypes.STRING,
//     },
//     address_2: {
//       type: DataTypes.STRING,
//     },
//     city: {
//       type: DataTypes.STRING,
//     },
//     state: {
//       type: DataTypes.STRING,
//     },
//     postal_code: {
//       type: DataTypes.STRING,
//     },
//     phone: {
//       type: DataTypes.STRING,
//     },

//     date_of_birth: {
//       type: DataTypes.DATE,
//     },
//     hire_date: {
//       type: DataTypes.DATE,
//     },
//     emergency_contact_name: {
//       type: DataTypes.STRING,
//     },
//     emergency_contact_phone: {
//       type: DataTypes.STRING,
//     },
//     notification_preference: {
//       type: DataTypes.STRING,
//     },
//     type: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       defaultValue: "A-List", // Default value if needed
//     },
//     status: {
//       type: DataTypes.ENUM("active", "inactive", "inactive-deceased"),
//       allowNull: false,
//       defaultValue: "active",
//     },
//   },
//   {
//     tableName: "employees",
//     timestamps: true,
//     underscored: true,
//   },
// );

"use strict";

module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define(
    "Employee",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      address_1: DataTypes.STRING,
      address_2: DataTypes.STRING,
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      postal_code: DataTypes.STRING,
      phone: DataTypes.STRING,
      mobile_phone: DataTypes.STRING,
      ssn: DataTypes.STRING,
      snf: DataTypes.STRING,
      number_id: DataTypes.STRING,
      comments: DataTypes.TEXT,
      date_of_birth: DataTypes.DATE,
      hire_date: DataTypes.DATE,
      emergency_contact_name: DataTypes.STRING,
      emergency_contact_phone: DataTypes.STRING,
      notification_preference: DataTypes.STRING,
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "A-List",
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "inactive-deceased"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      tableName: "employees",
      timestamps: true,
      underscored: true,
    },
  );

  Employee.associate = (models) => {
    Employee.belongsTo(models.User, { foreignKey: "user_id" });

    Employee.belongsToMany(models.Restriction, {
      through: "employee_restrictions",
      foreignKey: "employee_id",
      otherKey: "restriction_id",
      as: "restrictions", // ✅ ADD THIS
    });

    Employee.hasMany(models.RecurringBlockedTime, {
      foreignKey: "employee_id",
      as: "recurringBlockedTimes",
    });

    Employee.hasMany(models.TimeOff, {
      foreignKey: "employee_id",
      as: "timeOffs",
    });
  };

  return Employee;
};
