'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Producto extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Producto.hasMany(models.Inventario, { foreignKey: 'id_prod' });
      Producto.hasMany(models.Movimiento, { foreignKey: 'id_producto' });
    }
  }
  Producto.init({
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    nombre: DataTypes.STRING,
    imagen: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Producto',
  });
  return Producto;
};