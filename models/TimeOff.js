module.exports = (sequelize, DataTypes) => {
  const TimeOff = sequelize.define(
    "TimeOff",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      reason_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
      },
      end_date: {
        type: DataTypes.DATEONLY,
      },
      start_time: {
        type: DataTypes.TIME,
      },
      end_time: {
        type: DataTypes.TIME,
      },
    },
    {
      tableName: "time_offs",
      timestamps: true,
      underscored: true,
    },
  );

  TimeOff.associate = (models) => {
    TimeOff.belongsTo(models.Employee, {
      foreignKey: "employee_id",
      as: "employee",
    });

    TimeOff.belongsTo(models.TimeOffReason, {
      foreignKey: "reason_id",
      as: "reason",
    });
  };

  return TimeOff;
};
