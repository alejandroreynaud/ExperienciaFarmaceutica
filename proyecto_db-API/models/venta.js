'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Venta extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Venta.belongsTo(models.Cliente, { foreignKey: 'id_cliente' });
      Venta.belongsTo(models.Usuario, { foreignKey: 'id_vendedor' });
      Venta.hasOne(models.Factura, { foreignKey: 'id_venta' });
    }
  }
  Venta.init({
    id_vendedor: DataTypes.INTEGER,
    id_cliente: DataTypes.INTEGER,
    total: DataTypes.DECIMAL,
    metodo_pago: DataTypes.STRING,
    estado: DataTypes.BOOLEAN,
    fecha: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Venta',
  });
  return Venta;
};