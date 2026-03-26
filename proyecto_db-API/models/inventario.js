"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Inventario extends Model {
    static associate(models) {
      Inventario.belongsTo(models.Producto, { foreignKey: "id_prod" });
      Inventario.hasMany(models.LoteProveedor, { foreignKey: "id_lote" });
      Inventario.hasMany(models.DetalleCompra, { foreignKey: "id_lote" });
      Inventario.hasMany(models.DetalleFactura, { foreignKey: "id_lote" });
      Inventario.hasMany(models.Movimiento, { foreignKey: "id_lote" });
    }
  }

  Inventario.init(
    {
      id_prod: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cantidad_inicial: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fecha_compra: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_vencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      lote_activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      precio_costo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Precio al que se compró este lote al proveedor",
      },
      precio_venta: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: "Precio al que se vende al cliente",
      },
    },
    {
      sequelize,
      modelName: "Inventario",
    },
  );

  return Inventario;
};
