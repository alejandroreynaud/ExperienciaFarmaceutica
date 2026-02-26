'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rol extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Rol.belongsToMany(models.Usuario, { through: models.UsuarioRol, foreignKey: 'id_rol', otherKey: 'id_usuario' });
      Rol.belongsToMany(models.Privilegio, { through: models.RolPrivilegio, foreignKey: 'id_rol', otherKey: 'id_privilegio' });
    }
  }
  Rol.init({
    nombre: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Rol',
  });
  return Rol;
};