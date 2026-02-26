'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Factura extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Factura.belongsTo(models.Venta, { foreignKey: 'id_venta' });
      Factura.hasMany(models.DetalleFactura, { foreignKey: 'id_factura' });
      Factura.hasOne(models.CuentaPorCobrar, { foreignKey: 'id_factura' });
    }
  }
  Factura.init({
    id_venta: DataTypes.INTEGER,
    num_factura: DataTypes.STRING,
    fecha: DataTypes.DATE,
    url_imagen: DataTypes.STRING,
    hash_doc: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Factura',
  });
  return Factura;
};