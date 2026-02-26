'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
        Usuario.belongsToMany(models.Rol, { through: models.UsuarioRol, foreignKey: 'id_usuario', otherKey: 'id_rol' });
        Usuario.hasMany(models.Compra, { foreignKey: 'id_usuario' });
        Usuario.hasMany(models.Venta, { foreignKey: 'id_vendedor' });
        Usuario.hasMany(models.Movimiento, { foreignKey: 'id_usuario' });
    }
  }
  Usuario.init({
    nombre: DataTypes.STRING,
    telefono: DataTypes.STRING,
    correo: DataTypes.STRING,
    estado: DataTypes.BOOLEAN,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Usuario',
  });
  return Usuario;
};