'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DetalleCompra extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DetalleCompra.belongsTo(models.Compra, { foreignKey: 'id_compra' });
      DetalleCompra.belongsTo(models.Inventario, { foreignKey: 'id_lote' });
    }
  }
  DetalleCompra.init({
    id_compra: DataTypes.INTEGER,
    id_lote: DataTypes.INTEGER,
    cantidad: DataTypes.INTEGER,
    subtotal: DataTypes.DECIMAL
  }, {
    sequelize,
    modelName: 'DetalleCompra',
  });
  return DetalleCompra;
};