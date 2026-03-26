'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Compras', 'rtn', {
      type: Sequelize.STRING(14),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Compras', 'rtn');
  },
};
