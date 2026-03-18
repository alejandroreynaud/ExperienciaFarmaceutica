'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Backfill existing null values before adding NOT NULL constraints.
    await queryInterface.bulkUpdate('Usuarios', { nombre: 'SIN_NOMBRE' }, { nombre: { [Sequelize.Op.eq]: null } });
    await queryInterface.bulkUpdate('Usuarios', { telefono: 'SIN_TELEFONO' }, { telefono: { [Sequelize.Op.eq]: null } });
    await queryInterface.bulkUpdate('Usuarios', { correo: 'sin-correo@example.com' }, { correo: { [Sequelize.Op.eq]: null } });
    await queryInterface.bulkUpdate('Usuarios', { estado: true }, { estado: { [Sequelize.Op.eq]: null } });
    await queryInterface.bulkUpdate('Usuarios', { password: 'TEMPORAL_CAMBIAR' }, { password: { [Sequelize.Op.eq]: null } });

    await queryInterface.changeColumn('Usuarios', 'nombre', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('Usuarios', 'telefono', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('Usuarios', 'correo', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('Usuarios', 'estado', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.changeColumn('Usuarios', 'password', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Usuarios', 'nombre', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Usuarios', 'telefono', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Usuarios', 'correo', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Usuarios', 'estado', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.changeColumn('Usuarios', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};