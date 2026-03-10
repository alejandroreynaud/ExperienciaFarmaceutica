'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RolPrivilegios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      id_rol: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Rols',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_privilegio: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Privilegios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    await queryInterface.addConstraint('RolPrivilegios', {
      fields: ['id_rol', 'id_privilegio'],
      type: 'unique',
      name: 'uq_rol_privilegio'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RolPrivilegios');
  }
};