const express = require('express')
const multer = require('multer')
const path = require('path')
const findingController = require('../controllers/findingController')
const authMiddleware = require('../middlewares/authMiddleware')

const router = express.Router()

// Configuração do multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { id } = req.params
    const uploadPath = path.join(__dirname, '../../uploads/findings', id || 'temp')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Tipo de ficheiro não permitido. Use JPG, PNG ou PDF.'))
    }
  }
})

// Todas as rotas requerem autenticação
router.use(authMiddleware)

// Rotas públicas (dentro do contexto autenticado)
router.get('/estatisticas', findingController.estatisticas)
router.get('/atrasados', findingController.atrasados)
router.post('/gerar-numero', findingController.gerarNumeroProcesso)

// Rotas principais
router.get('/', findingController.index)
router.get('/:id', findingController.show)
router.get('/numero/:numero', findingController.buscarPorNumero)

// Criar finding (Parte 1)
router.post('/', findingController.createParte1)

// Atualizar finding (Partes 2 e 3)
router.put('/:id/parte2', findingController.updateParte2)
router.put('/:id/parte3', findingController.updateParte3)

// Upload de anexos
router.post('/:id/anexos', upload.single('anexo'), findingController.addAnexo)

module.exports = router