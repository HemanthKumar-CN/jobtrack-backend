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
      name: {
        type: DataTypes.STRING,
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
  };

  return TimeOff;
};
