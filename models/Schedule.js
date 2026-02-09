// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");
// const Employee = require("./Employee");
// const Event = require("./Events");

// const Schedule = sequelize.define(
//   "Schedule",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//       allowNull: false,
//     },
//     employee_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "employees",
//         key: "id",
//       },
//     },
//     task_event_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: {
//         model: "events",
//         key: "id",
//       },
//     },
//     title: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//     start_date: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },
//     end_date: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },

//     start_time: {
//       type: DataTypes.TIME,
//       allowNull: false,
//     },

//     end_time: {
//       type: DataTypes.TIME,
//       allowNull: false,
//     },

//     status: {
//       type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
//       allowNull: false,
//       defaultValue: "scheduled",
//     },
//     is_deleted: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false,
//     },
//   },
//   {
//     tableName: "schedules",
//     timestamps: true,
//     underscored: true,
//   },
// );

// // Define relationships
// Schedule.belongsTo(Employee, { foreignKey: "employee_id" });
// Schedule.belongsTo(Event, { foreignKey: "task_event_id" });

// module.exports = Schedule;

const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define(
    "Schedule",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
      },
      task_event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "events",
          key: "id",
        },
      },

      // classification_id: {
      //   type: DataTypes.INTEGER,
      //   allowNull: true,
      //   references: {
      //     model: "classifications",
      //     key: "id",
      //   },
      // },

      contractor_class_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "contractor_classes",
          key: "id",
        },
      },
      event_location_contractor_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "event_location_contractors",
          key: "id",
        },
      },

      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
        get() {
          const value = this.getDataValue("start_time");
          if (!value) return null;
          // Return as plain string without timezone conversion
          return moment(value).format("YYYY-MM-DD HH:mm:ss");
        },
      },

      status: {
        type: DataTypes.ENUM("pending", "confirmed", "declined"),
        allowNull: false,
        defaultValue: "pending",
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      responded_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      response_token: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: "schedules",
      timestamps: true,
      underscored: true,
    },
  );

  Schedule.associate = (models) => {
    Schedule.belongsTo(models.Employee, { foreignKey: "employee_id" });
    Schedule.belongsTo(models.Event, { foreignKey: "task_event_id" });
    Schedule.belongsTo(models.ContractorClass, {
      foreignKey: "contractor_class_id",
    });
    Schedule.belongsTo(models.EventLocationContractor, {
      foreignKey: "event_location_contractor_id",
    });
    Schedule.hasOne(models.Timesheet, {
      foreignKey: "schedule_id",
      as: "timesheet",
    });
  };

  return Schedule;
};

// log check
