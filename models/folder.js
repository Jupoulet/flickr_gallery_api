'use strict';
const moment = require ('moment');
module.exports = (sequelize, DataTypes) => {
  const folder = sequelize.define('folder', {
    name: DataTypes.STRING,
    mainPhoto: DataTypes.STRING,
    description: DataTypes.STRING,
    year: {
      type: DataTypes.DATE,
      defaultValue: moment()
    }
  }, {});
  folder.associate = function(models) {
    // associations can be defined here
    folder.belongsTo(folder, { as: 'parent', foreignKey: 'parentId'})
    folder.hasMany(folder, { as: 'children', foreignKey: 'parentId'})
    folder.hasMany(models.photos, { as: 'photos' })
  };
  return folder;
};