'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CuentaPorCobrars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_factura: {
        type: Sequelize.INTEGER
      },
      id_cliente: {
        type: Sequelize.INTEGER
      },
      saldo_pendiente: {
        type: Sequelize.DECIMAL
      },
      estado: {
        type: Sequelize.BOOLEAN
      },
      fecha_creado: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CuentaPorCobrars');
  }
};