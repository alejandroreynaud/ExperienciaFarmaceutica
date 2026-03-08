const { Usuario,Rol } = require('../models');

// Obtener todos los usuarios
const getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
  if (usuarios === null || usuarios.length > 0) {
      res.status(200).json(usuarios);
    } else {
      res.status(400).json({
        status: "BAD REQUEST",
        message: "No Existen usuarios en la Base de datos",
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error internal Server :c", error: error.message });
  }
};

// Obtener usuario por ID
  const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'El id es inválido' });
    }
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear nuevo usuario
const createUsuario = async (req, res) => {
  try {
    const { nombre, telefono, correo, password, estado } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos' });
    }

    const nuevoUsuario = await Usuario.create({
      nombre,
      telefono,
      correo,
      password,
      estado: estado !== undefined ? estado : true
    });

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'El correo ya está registrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, correo, password, estado } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.update({
      nombre,
      telefono,
      correo,
      password,
      estado
    });

    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'El correo ya está registrado' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

// Deshabilitar usuario
const deshabilitarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'El id es inválido' });
    }

    const usuario = await Usuario.findByPk(id);
    console.log('Usuario encontrado para deshabilitar:', usuario);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.update({ estado: false });
    res.status(200).json({ message: 'Usuario deshabilitado exitosamente' });
  } catch (error) {
    console.error('Error al deshabilitar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Habilitar usuario
const habilitarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'El id es inválido' });
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await usuario.update({ estado: true });
    res.status(200).json({ message: 'Usuario habilitado' });
  } catch (error) {
    console.error('Error al habilitar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
    }

    const usuario = await Usuario.findOne({ where: { correo } });


    if (!usuario || usuario.password !== password || !usuario.estado) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    res.status(200).json({
      message: 'Login exitoso',
      usuario: usuario
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar estado del usuario
const checkStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'El id es inválido' });
    }

    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ error: 'No se encontró el usuario' });
    }

    res.status(200).json({
      id: usuario.id,
      estado: usuario.estado
    });
  } catch (error) {
    console.error('Error al verificar estado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Verificar si usuario tiene los roles requeridos
const checkRole = async (req, res) => {
  try {
    const { id_usuario, rolesRequeridos } = req.body;

    if (!id_usuario || !rolesRequeridos || !Array.isArray(rolesRequeridos)) {
      return res.status(400).json({ 
        error: 'Debe enviar id_usuario y rolesRequeridos (array)' 
      });
    }

    // Buscar usuario con sus roles
    const usuario = await Usuario.findByPk(id_usuario, {
      include: [{
        model: Rol,
        through: { attributes: [] },
        attributes: ['nombre']
      }]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (!usuario.estado) {
      return res.status(401).json({ error: 'Usuario deshabilitado' });
    }

    // Obtener los roles del usuario
    const rolesUsuario = usuario.Rols ? usuario.Rols.map(r => r.nombre) : [];

    // Roles permitidos para la empresa
    const rolesPermitidos = ['admin', 'gerente', 'empleado', 'cajero', 'almacenista'];
    
    // Verificar que el usuario tenga un rol válido de empresa
    const tieneRolValido = rolesUsuario.some(rol => rolesPermitidos.includes(rol));

    if (!tieneRolValido) {
      return res.status(403).json({ 
        error: 'Usuario no tiene roles válidos de empresa' 
      });
    }

    // Verificar si tiene los roles necesarios
    const tieneRolesRequeridos = rolesRequeridos.some(rol => rolesUsuario.includes(rol));

    if (!tieneRolesRequeridos) {
      return res.status(403).json({ 
        error: 'usuario no tiene los permisos requeridos' 
      });
    }

    res.status(200).json({
      autorizado: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo
      },
      rolesActuales: rolesUsuario
    });
  } catch (error) {
    console.error('Error al verificar rol:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deshabilitarUsuario,
  habilitarUsuario,
  login,
  checkStatus,
  checkRole
};