'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Inventarios', 'precio_costo', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Precio al que se compró este lote al proveedor'
    });

    await queryInterface.addColumn('Inventarios', 'precio_venta', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Precio al que se vende al cliente'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Inventarios', 'precio_costo');
    await queryInterface.removeColumn('Inventarios', 'precio_venta');
  }
};
