const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Contractor = require("./Contractor");
const Location = require("./Location");

const Event = sequelize.define(
  "Event",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    event_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contractor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "contractors",
        key: "id",
      },
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "locations",
        key: "id",
      },
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "Events",
    timestamps: true,
    underscored: true,
  },
);

// Define relationships
Event.belongsTo(Contractor, { foreignKey: "contractor_id" });
Event.belongsTo(Location, { foreignKey: "location_id" });

module.exports = Event;
