'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Cliente extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Cliente.hasMany(models.Venta, { foreignKey: 'id_cliente' });
      Cliente.hasMany(models.CuentaPorCobrar, { foreignKey: 'id_cliente' });
    }
  }
  Cliente.init({
    nombre: DataTypes.STRING,
    identidad: DataTypes.STRING,
    RTN: DataTypes.STRING,
    telefono: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Cliente',
  });
  return Cliente;
};