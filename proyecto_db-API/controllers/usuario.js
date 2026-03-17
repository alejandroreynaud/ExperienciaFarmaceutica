const { Op } = require('sequelize');
const { Usuario,Rol } = require('../models');

// Obtener todos los usuarios
const getAllUsuarios = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
 
    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      attributes: { exclude: ['password'] }, 
      limit,
      offset,
      order: [['nombre', 'ASC']]
    });
 
    res.status(200).json({
      total: count,
      pagina: page,
      porPagina: limit,
      usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Buscar usuarios por correo, nombre o estado
const getUsuariosFiltrados = async (req, res) => {
  try {
    const { correo, nombre, estado } = req.query;
    const where = {};
 
    if (!correo && !nombre && estado === undefined) {
      return res.status(400).json({
        error: 'Debe enviar al menos un filtro: correo, nombre o estado'
      });
    }
 
    if (correo) {
      where.correo = { [Op.like]: `%${correo.trim().toLowerCase()}%` }; // Op.like para compatibilidad
    }
 
    if (nombre) {
      where.nombre = { [Op.like]: `%${nombre.trim()}%` };
    }
 
    if (estado !== undefined) {
      if (estado !== 'true' && estado !== 'false') {
        return res.status(400).json({ error: 'El filtro estado debe ser true o false' });
      }
      where.estado = estado === 'true';
    }
 
    const usuarios = await Usuario.findAll({
      where,
      attributes: { exclude: ['password'] } // excluir password
    });
 
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al filtrar usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear nuevo usuario
const bcrypt = require('bcrypt');
const createUsuario = async (req, res) => {
  try {
    const { nombre, telefono, correo, password, estado } = req.body;
 
    // Validacion de presencia
    if (!nombre?.trim() || !telefono?.trim() || !correo?.trim() || !password?.trim()) {
      return res.status(400).json({ 
        error: 'Nombre, correo, telefono y contrasena son requeridos',
        status: 400

      });
    }
 
    // Validacion de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo.trim())) {
      return res.status(400).json({ error: 'Formato de correo invalido', status: 400 });
    }
 
    // Validacion de contrasena segura
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres', status: 400 });
    }
 
    const correoNormalizado = correo.trim().toLowerCase();
 
    const usuarioExistente = await Usuario.findOne({ where: { correo: correoNormalizado } });
    if (usuarioExistente) {
      return res.status(409).json({ error: 'El correo ya esta registrado', status: 409 }); // 409 Conflict es mas apropiado
    }
 
    // Hashear la password ANTES de guardar
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const nuevoUsuario = await Usuario.create({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      correo: correoNormalizado,
      password: hashedPassword,
      estado: estado !== undefined ? estado : true
    });
 
    // Nunca retornar la password
    const { password: _, ...usuarioSinPassword } = nuevoUsuario.toJSON();
    res.status(201).json(usuarioSinPassword);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'El correo ya esta registrado', status: 409 });
    } else {
      res.status(500).json({ error: 'Error interno del servidor', status: 500 });
    }
  }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
 
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'El id del usuario es invalido' });
    }
 
    const { nombre, telefono, correo, estado } = req.body;
    // Nota: password se maneja en un endpoint separado por seguridad
 
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
 
    if (correo) {
      const correoNormalizado = correo.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correoNormalizado)) {
        return res.status(400).json({ error: 'Formato de correo invalido' });
      }
      const usuarioConCorreo = await Usuario.findOne({ where: { correo: correoNormalizado } });
      if (usuarioConCorreo && usuarioConCorreo.id !== usuario.id) {
        return res.status(409).json({ error: 'El correo ya esta en uso' });
      }
    }
 
    // Solo actualizar los campos que vienen en el body (patch semantics)
    const datosActualizados = {};
    if (nombre?.trim())   datosActualizados.nombre = nombre.trim();
    if (telefono?.trim()) datosActualizados.telefono = telefono.trim();
    if (correo?.trim())   datosActualizados.correo = correo.trim().toLowerCase();
    if (estado !== undefined) datosActualizados.estado = estado;
 
    await usuario.update(datosActualizados);
 
    const { password: _, ...usuarioSinPassword } = usuario.toJSON();
    res.status(200).json(usuarioSinPassword);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'El correo ya esta registrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params; 
 
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'El id del usuario es invalido', status: 400 });
    }
 
    const usuario = await Usuario.findByPk(id);
 
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado', status: 404 });
    }
 
    const nuevoEstado = !usuario.estado;
    await usuario.update({ estado: nuevoEstado });
 
    res.status(200).json({
      message: `Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'} correctamente`,
      id: usuario.id,
      estado: nuevoEstado,
      status: 200
    });
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor', status: 500 });
  }
};

const login = async (req, res) => {
  try {
    const { correo, password } = req.body;
 
    if (!correo?.trim() || !password?.trim()) {
      return res.status(400).json({ error: 'Correo y contrasena son requeridos', status: 400 });
    }
 
    const correoNormalizado = correo.trim().toLowerCase();
    const usuario = await Usuario.findOne({
      where: { correo: correoNormalizado },
      include: [{ model: Rol, through: { attributes: [] }, attributes: ['nombre'] }]
    });
 
    // Verificar existencia y password
    if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
      return res.status(401).json({ error: 'Credenciales invalidas', status: 401 });
    }
 
    // Verificar estado por separado para mensaje claro
    if (!usuario.estado) {
      return res.status(403).json({ error: 'Tu cuenta esta deshabilitada, contacta al administrador', status: 403 });
    }

 
    res.status(200).json({
      message: 'Login exitoso',
      status: 200,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        roles: usuario.Rols?.map(r => r.nombre) || []
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor', status: 500 });
  }
};

// Verificar estado del usuario
const checkStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
 
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'El id es invalido', status: 400 });
    }
 
    const usuario = await Usuario.findByPk(id, {
      attributes: ['id', 'estado'] // Solo traer lo necesario
    });
 
    if (!usuario) {
      return res.status(404).json({ error: 'No se encontro el usuario', status: 404 });
    }
 
    res.status(200).json({ id: usuario.id, estado: usuario.estado, status: 200 });
  } catch (error) {
    console.error('Error al verificar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor', status: 500 });
  }
};

module.exports = {
  getAllUsuarios,
  getUsuariosFiltrados,
  createUsuario,
  updateUsuario,
  cambiarEstadoUsuario,
  login,
  checkStatus,
  
};