const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User");

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
    address_1: {
      type: DataTypes.STRING,
    },
    address_2: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    postal_code: {
      type: DataTypes.STRING,
    },
    phone: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    position: {
      type: DataTypes.STRING,
    },
    date_of_birth: {
      type: DataTypes.DATE,
    },
    hire_date: {
      type: DataTypes.DATE,
    },
    emergency_contact_name: {
      type: DataTypes.STRING,
    },
    emergency_contact_phone: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "employees",
    timestamps: true,
    underscored: true,
  },
);

// Define the relationship
Employee.belongsTo(User, { foreignKey: "user_id" });

module.exports = Employee;
