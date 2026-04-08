import React, { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { AerodromosService } from '../../services/aerodromos';
import { useAuth } from '../../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FlightTakeoff as FlightIcon,
} from '@mui/icons-material';

export const AerodromosPage = () => {
  const { isAdmin, isInspetor } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aerodromos, setAerodromos] = useState([]);
  const [direcoes, setDirecoes] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAerodromo, setEditingAerodromo] = useState(null);
  const [formData, setFormData] = useState({
    codigo_oaci: '',
    nome: '',
    cidade: '',
    provincia: '',
    categoria: '',
    direcao_id: '',
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
      const [aerodromosData, provinciasData, categoriasData] = await Promise.all([
        AerodromosService.listar(),
        AerodromosService.getProvincias(),
        AerodromosService.getCategorias()
      ]);
      setAerodromos(aerodromosData || []);
      setProvincias(provinciasData || []);
      setCategorias(categoriasData || []);
      const { UsersService } = await import('../../services/users');
      const direcoesData = await UsersService.getDirecoes();
      setDirecoes(direcoesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar lista de aeródromos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (aerodromo = null) => {
    if (aerodromo) {
      setEditingAerodromo(aerodromo);
      setFormData({
        codigo_oaci: aerodromo.codigo_oaci || '',
        nome: aerodromo.nome || '',
        cidade: aerodromo.cidade || '',
        provincia: aerodromo.provincia || '',
        categoria: aerodromo.categoria || '',
        direcao_id: aerodromo.direcao_id || '',
        ativo: aerodromo.ativo !== undefined ? aerodromo.ativo : true
      });
    } else {
      setEditingAerodromo(null);
      setFormData({
        codigo_oaci: '',
        nome: '',
        cidade: '',
        provincia: '',
        categoria: '',
        direcao_id: '',
        ativo: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAerodromo(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (name === 'codigo_oaci' ? value.toUpperCase() : value) }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (editingAerodromo) {
        await AerodromosService.atualizar(editingAerodromo.id, formData);
      } else {
        await AerodromosService.criar(formData);
      }
      await carregarDados();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar aeródromo:', error);
      setError(error.response?.data?.error || 'Erro ao salvar aeródromo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAtivo = async (aerodromo) => {
    try {
      await AerodromosService.atualizar(aerodromo.id, { ativo: !aerodromo.ativo });
      await carregarDados();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setError('Erro ao alterar status do aeródromo');
    }
  };

  const podeEditar = () => isAdmin || isInspetor;

  const filteredAerodromos = aerodromos.filter(aero =>
    aero.codigo_oaci?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aero.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aero.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aero.provincia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedAerodromos = filteredAerodromos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading && aerodromos.length === 0) {
    return (
      <Layout title="Gestão de Aeródromos">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
      </Layout>
    );
  }

  return (
    <Layout title="Gestão de Aeródromos">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F4E79' }}>Aeródromos</Typography>
        {podeEditar() && <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Novo Aeródromo</Button>}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs><TextField fullWidth size="small" placeholder="Pesquisar por código, nome, cidade ou província..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }} /></Grid>
          <Grid item><Tooltip title="Recarregar"><IconButton onClick={carregarDados}><RefreshIcon /></IconButton></Tooltip></Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Código OACI</TableCell><TableCell>Nome</TableCell><TableCell>Cidade</TableCell><TableCell>Província</TableCell><TableCell>Categoria</TableCell><TableCell>Direção</TableCell><TableCell>Status</TableCell>
              {podeEditar() && <TableCell align="center">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAerodromos.length === 0 ? (
              <TableRow><TableCell colSpan={podeEditar() ? 8 : 7} align="center">Nenhum aeródromo encontrado</TableCell></TableRow>
            ) : (
              paginatedAerodromos.map((aero) => (
                <TableRow key={aero.id} hover>
                  <TableCell><Chip icon={<FlightIcon />} label={aero.codigo_oaci} size="small" color="primary" variant="outlined" /></TableCell>
                  <TableCell>{aero.nome}</TableCell>
                  <TableCell>{aero.cidade}</TableCell>
                  <TableCell>{aero.provincia}</TableCell>
                  <TableCell>{aero.categoria}</TableCell>
                  <TableCell>{aero.direcao?.sigla || 'N/A'}</TableCell>
                  <TableCell><Chip label={aero.ativo ? 'Ativo' : 'Inativo'} color={aero.ativo ? 'success' : 'error'} size="small" /></TableCell>
                  {podeEditar() && (
                    <TableCell align="center">
                      <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpenDialog(aero)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      {isAdmin && <Tooltip title={aero.ativo ? 'Desativar' : 'Ativar'}><IconButton size="small" color={aero.ativo ? 'error' : 'success'} onClick={() => handleToggleAtivo(aero)}>{aero.ativo ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}</IconButton></Tooltip>}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination rowsPerPageOptions={[5,10,25,50]} component="div" count={filteredAerodromos.length} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, newPage) => setPage(newPage)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value,10)); setPage(0); }} labelRowsPerPage="Linhas por página" />
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingAerodromo ? 'Editar Aeródromo' : 'Novo Aeródromo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth required name="codigo_oaci" label="Código OACI" value={formData.codigo_oaci} onChange={handleChange} inputProps={{ style: { textTransform: 'uppercase' } }} helperText="Ex: FQMA, FQMP, FQNC" />
            <TextField fullWidth required name="nome" label="Nome do Aeródromo" value={formData.nome} onChange={handleChange} />
            <TextField fullWidth required name="cidade" label="Cidade" value={formData.cidade} onChange={handleChange} />
            <FormControl fullWidth required><InputLabel>Província</InputLabel><Select name="provincia" value={formData.provincia} label="Província" onChange={handleChange}>{provincias.map(p => (<MenuItem key={p} value={p}>{p}</MenuItem>))}</Select></FormControl>
            <FormControl fullWidth required><InputLabel>Categoria</InputLabel><Select name="categoria" value={formData.categoria} label="Categoria" onChange={handleChange}>{categorias.map(c => (<MenuItem key={c} value={c}>{c}</MenuItem>))}</Select></FormControl>
            <FormControl fullWidth required><InputLabel>Direção</InputLabel><Select name="direcao_id" value={formData.direcao_id} label="Direção" onChange={handleChange}>{direcoes.map(d => (<MenuItem key={d.id} value={d.id}>{d.sigla} - {d.nome}</MenuItem>))}</Select></FormControl>
            {editingAerodromo && <FormControlLabel control={<Switch name="ativo" checked={formData.ativo} onChange={handleChange} />} label="Ativo" />}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={handleCloseDialog}>Cancelar</Button><Button onClick={handleSubmit} variant="contained" disabled={submitting}>{submitting ? <CircularProgress size={24} /> : 'Salvar'}</Button></DialogActions>
      </Dialog>
    </Layout>
  );
};