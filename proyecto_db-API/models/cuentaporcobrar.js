'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CuentaPorCobrar extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CuentaPorCobrar.belongsTo(models.Factura, { foreignKey: 'id_factura' });
      CuentaPorCobrar.belongsTo(models.Cliente, { foreignKey: 'id_cliente' });
    }
  }
  CuentaPorCobrar.init({
    id_factura: DataTypes.INTEGER,
    id_cliente: DataTypes.INTEGER,
    saldo_pendiente: DataTypes.DECIMAL,
    estado: DataTypes.BOOLEAN,
    fecha_creado: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'CuentaPorCobrar',
  });
  return CuentaPorCobrar;
};