'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LoteProveedor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      LoteProveedor.belongsTo(models.Inventario, { foreignKey: 'id_lote' });
      LoteProveedor.belongsTo(models.Proveedor, { foreignKey: 'id_prov' });
    }
  }
  LoteProveedor.init({
    id_lote: DataTypes.INTEGER,
    id_prov: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'LoteProveedor',
  });
  return LoteProveedor;
};