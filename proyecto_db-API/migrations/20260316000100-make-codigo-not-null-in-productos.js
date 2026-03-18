'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [results] = await queryInterface.sequelize.query(
      "SELECT id FROM \"Productos\" WHERE codigo IS NULL OR TRIM(codigo) = '' LIMIT 1;"
    );

    if (results.length > 0) {
      throw new Error('Existen productos sin codigo. Completa esos registros antes de aplicar esta migracion.');
    }

    await queryInterface.changeColumn('Productos', 'codigo', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Productos', 'codigo', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
  }
};
