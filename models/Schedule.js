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
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },

      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },

      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "scheduled",
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
  };

  return Schedule;
};
