import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { AreasInspecaoService } from '../../services/areasInspecao';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

export const AreasInspecaoPage = () => {
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areas, setAreas] = useState([]);
  
  // Estados para paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    ativo: true
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const areasData = await AreasInspecaoService.listar();
      setAreas(areasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar lista de áreas de inspeção');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (area = null) => {
    if (area) {
      setEditingArea(area);
      setFormData({
        codigo: area.codigo || '',
        nome: area.nome || '',
        descricao: area.descricao || '',
        ativo: area.ativo !== undefined ? area.ativo : true
      });
    } else {
      setEditingArea(null);
      setFormData({
        codigo: '',
        nome: '',
        descricao: '',
        ativo: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingArea(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value.toUpperCase()
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      if (editingArea) {
        await AreasInspecaoService.atualizar(editingArea.id, formData);
      } else {
        await AreasInspecaoService.criar(formData);
      }
      
      await carregarDados();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar área:', error);
      setError(error.response?.data?.error || 'Erro ao salvar área');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAtivo = async (area) => {
    try {
      await AreasInspecaoService.atualizar(area.id, { ativo: !area.ativo });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setError('Erro ao alterar status da área');
    }
  };

  const filteredAreas = areas.filter(area => 
    area.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedAreas = filteredAreas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading && areas.length === 0) {
    return (
      <Layout title="Gestão de Áreas de Inspeção">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Gestão de Áreas de Inspeção">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Áreas de Inspeção
        </Typography>
        
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nova Área
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Barra de Pesquisa */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              size="small"
              placeholder="Pesquisar por código, nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item>
            <Tooltip title="Recarregar">
              <IconButton onClick={carregarDados}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de Áreas */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell align="center">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAreas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                  <Typography color="textSecondary" sx={{ py: 2 }}>
                    Nenhuma área de inspeção encontrada
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAreas.map((area) => (
                <TableRow key={area.id} hover>
                  <TableCell>
                    <Chip
                      icon={<CategoryIcon />}
                      label={area.codigo}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{area.nome}</TableCell>
                  <TableCell>{area.descricao || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={area.ativo ? 'Ativo' : 'Inativo'}
                      color={area.ativo ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(area)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={area.ativo ? 'Desativar' : 'Ativar'}>
                        <IconButton
                          size="small"
                          color={area.ativo ? 'error' : 'success'}
                          onClick={() => handleToggleAtivo(area)}
                        >
                          {area.ativo ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAreas.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Linhas por página"
        />
      </TableContainer>

      {/* Diálogo de Criar/Editar Área */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingArea ? 'Editar Área de Inspeção' : 'Nova Área de Inspeção'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              required
              name="codigo"
              label="Código"
              value={formData.codigo}
              onChange={handleChange}
              inputProps={{ style: { textTransform: 'uppercase' } }}
              helperText="Ex: AGA, PANS, MET, SAR, CNS"
            />
            
            <TextField
              fullWidth
              required
              name="nome"
              label="Nome da Área"
              value={formData.nome}
              onChange={handleChange}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              name="descricao"
              label="Descrição"
              value={formData.descricao}
              onChange={handleChange}
            />
            
            {editingArea && (
              <FormControlLabel
                control={
                  <Switch
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                  />
                }
                label="Ativo"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};