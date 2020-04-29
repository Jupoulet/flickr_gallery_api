'use strict';
module.exports = (sequelize, DataTypes) => {
  const folder = sequelize.define('folder', {
    name: DataTypes.STRING,
    mainPhoto: DataTypes.STRING,
    description: DataTypes.STRING
  }, {});
  folder.associate = function(models) {
    // associations can be defined here
    folder.belongsTo(folder, { as: 'parent', foreignKey: 'parentId'})
    folder.hasMany(folder, { as: 'children', foreignKey: 'parentId'})
    folder.hasMany(models.photos, { as: 'photos' })
  };
  return folder;
};