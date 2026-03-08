const e = require('express');
const router = e.Router();
const {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deshabilitarUsuario,
  habilitarUsuario,
  login,
  checkStatus,
  checkRole
} = require('../controllers/usuario');

// GET /usuarios - Obtener todos los usuarios
router.get('/getAll', getAllUsuarios);

// POST /usuarios/login - Login de usuario
router.post('/login', login);

// POST /usuarios/check-role - Verificar rol del usuario
router.post('/check-role', checkRole);

// GET /usuarios/:id - Obtener usuario por ID
router.get('/:id', getUsuarioById);

// POST /usuarios - Crear nuevo usuario
router.post('/', createUsuario);

// PUT /usuarios/:id - Actualizar usuario
router.put('/:id', updateUsuario);

// PATCH /usuarios/:id/deshabilitar - Deshabilitar usuario
router.patch('/:id/deshabilitar', deshabilitarUsuario);

//PATCH /usuarios/:id/habilitar - Habilitar usuario
router.patch('/:id/habilitar', habilitarUsuario);

//GET /usuarios/:id/status - Verificar estado del usuario
router.get('/:id/status', checkStatus);

module.exports = router;
