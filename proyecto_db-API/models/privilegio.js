'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Privilegio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Privilegio.belongsToMany(models.Rol, { through: models.RolPrivilegio, foreignKey: 'id_privilegio', otherKey: 'id_rol' });
    }
  }
  Privilegio.init({
    nombre: DataTypes.STRING,
    desc: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Privilegio',
  });
  return Privilegio;
};