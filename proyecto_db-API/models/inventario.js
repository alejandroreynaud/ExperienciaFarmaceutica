'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Inventario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Inventario.belongsTo(models.Producto, { foreignKey: 'id_prod' });
      Inventario.hasMany(models.LoteProveedor, { foreignKey: 'id_lote' });
      Inventario.hasMany(models.DetalleCompra, { foreignKey: 'id_lote' });
      Inventario.hasMany(models.DetalleFactura, { foreignKey: 'id_lote' });
      Inventario.hasMany(models.Movimiento, { foreignKey: 'id_lote' });
    }
  }
  Inventario.init({
    id_prod: DataTypes.INTEGER,
    cantidad: DataTypes.INTEGER,
    cantidad_inicial: DataTypes.INTEGER,
    fecha_compra: DataTypes.DATE,
    fecha_vencimiento: DataTypes.DATE,
    lote_activo: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Inventario',
  });
  return Inventario;
};