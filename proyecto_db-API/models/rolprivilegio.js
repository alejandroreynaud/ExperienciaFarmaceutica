'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RolPrivilegio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      RolPrivilegio.belongsTo(models.Rol, { foreignKey: 'id_rol' });
      RolPrivilegio.belongsTo(models.Privilegio, { foreignKey: 'id_privilegio' });
    }
  }
  RolPrivilegio.init({
    id_rol: DataTypes.INTEGER,
    id_privilegio: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'RolPrivilegio',
  });
  return RolPrivilegio;
};