'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Movimiento extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Movimiento.belongsTo(models.Inventario, { foreignKey: 'id_lote' });
      Movimiento.belongsTo(models.Producto, { foreignKey: 'id_producto' });
      Movimiento.belongsTo(models.Usuario, { foreignKey: 'id_usuario' });
    }
  }
  Movimiento.init({
    id_lote: DataTypes.INTEGER,
    id_producto: DataTypes.INTEGER,
    tipo: DataTypes.STRING,
    id_referencia: DataTypes.INTEGER,
    tabla_referencia: DataTypes.STRING,
    cantidad: DataTypes.INTEGER,
    stock_antes: DataTypes.INTEGER,
    stock_despues: DataTypes.INTEGER,
    id_usuario: DataTypes.INTEGER,
    fecha: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Movimiento',
  });
  return Movimiento;
};