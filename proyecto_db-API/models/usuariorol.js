'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UsuarioRol extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UsuarioRol.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
      UsuarioRol.belongsTo(models.Rol, { foreignKey: 'id_rol' });
    }
  }
  UsuarioRol.init({
    id_usuario: DataTypes.INTEGER,
    id_rol: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UsuarioRol',
  });
  return UsuarioRol;
};