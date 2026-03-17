const express = require('express')
const aerodromoController = require('../controllers/aerodromoController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()

// Todas as rotas de aeródromo requerem autenticação
router.use(authMiddleware)

// Rotas públicas (para utilizadores autenticados)
router.get('/provincias', aerodromoController.listarProvincias)
router.get('/categorias', aerodromoController.listarCategorias)

// Rotas principais
router.get('/', aerodromoController.index)
router.get('/:id', aerodromoController.show)
router.get('/codigo/:codigo', aerodromoController.showByCode)
router.get('/:id/estatisticas', aerodromoController.estatisticas)

// Rotas que modificam dados (protegidas por perfil)
router.post('/', aerodromoController.create)
router.put('/:id', aerodromoController.update)
router.delete('/:id', aerodromoController.delete)

module.exports = router