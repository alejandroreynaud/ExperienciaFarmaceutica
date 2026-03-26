'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Compra extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Compra.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
      Compra.hasMany(models.DetalleCompra, { foreignKey: 'id_compra' });
    }
  }
  Compra.init({
    total: DataTypes.DECIMAL,
    metodo_pago: DataTypes.STRING,
    fecha: DataTypes.DATE,
    id_usuario: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Compra',
    tableName: 'compras',     
    timestamps: true
  });
  return Compra;
};