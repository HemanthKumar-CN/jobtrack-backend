"use strict";

module.exports = (sequelize, DataTypes) => {
  const ContractorClass = sequelize.define(
    "ContractorClass",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      classification_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "classification_id",
      },
      class_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      need_number: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "contractor_classes",
      timestamps: true,
      underscored: true,
    },
  );

  ContractorClass.associate = (models) => {
    ContractorClass.belongsTo(models.EventLocationContractor, {
      foreignKey: "assignment_id",
      as: "assignment",
    });
    ContractorClass.belongsTo(models.Classification, {
      foreignKey: "classification_id",
      as: "classification",
    });
  };

  return ContractorClass;
};
