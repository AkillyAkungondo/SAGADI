const express = require('express')
const areaInspecaoController = require('../controllers/areaInspecaoController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()

router.use(authMiddleware)

router.get('/', areaInspecaoController.index)
router.get('/mais-utilizadas', areaInspecaoController.maisUtilizadas)
router.get('/:id', areaInspecaoController.show)
router.get('/codigo/:codigo', areaInspecaoController.showByCode)
router.post('/', areaInspecaoController.create)
router.put('/:id', areaInspecaoController.update)
router.delete('/:id', areaInspecaoController.delete)

module.exports = router