'use strict';
module.exports = (sequelize, DataTypes) => {
  const photos = sequelize.define('photos', {
    title: DataTypes.STRING,
    file: DataTypes.STRING,
    year: DataTypes.DATE,
    description: DataTypes.STRING,
    data: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {});
  photos.associate = function(models) {
    // associations can be defined here
    photos.belongsTo(models.folder, { as: 'folder', foreignKey: 'folderId' })
  };
  return photos;
};