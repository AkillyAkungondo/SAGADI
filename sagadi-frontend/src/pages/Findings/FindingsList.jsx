import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout/Layout';
import { FindingsService } from '../../services/findings';
import { AerodromosService } from '../../services/aerodromos';
import { AreasInspecaoService } from '../../services/areasInspecao';
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
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  FlightTakeoff as FlightIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

export const FindingsList = () => {
  const navigate = useNavigate();
  const { user, isInspetor, isOperador, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [findings, setFindings] = useState([]);
  const [aerodromos, setAerodromos] = useState([]);
  const [areas, setAreas] = useState([]);

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtros
  const [filtros, setFiltros] = useState({
    status: '',
    aerodromo_id: '',
    area_id: '',
    data_inicio: '',
    data_fim: '',
    prioridade: '',
    nivel: '',
    keyword: '',
    apenas_meus: false,
    apenas_atrasados: false,
    apenas_abertos: false,
    prazo_maximo: 30,
  });

  // Ordenação
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  // Pesquisa rápida
  const [searchTerm, setSearchTerm] = useState('');

  // Estatísticas rápidas
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    abertos: 0,
    atrasados: 0,
    concluidos: 0,
  });

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    carregarFindings();
  }, [page, rowsPerPage, orderBy, order, filtros]);

  const carregarDadosIniciais = async () => {
    try {
      const [aerodromosData, areasData] = await Promise.all([
        AerodromosService.listar(),
        AreasInspecaoService.listar(),
      ]);
      setAerodromos(aerodromosData || []);
      setAreas(areasData || []);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  const carregarFindings = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filtros.status) params.status = filtros.status;
      if (filtros.aerodromo_id) params.aerodromo_id = filtros.aerodromo_id;
      if (filtros.area_id) params.area_id = filtros.area_id;
      if (filtros.prioridade) params.prioridade = filtros.prioridade;
      if (filtros.nivel) params.finding_level = filtros.nivel;
      if (filtros.keyword) params.keyword = filtros.keyword;
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;

      if (filtros.apenas_meus && (isInspetor || isOperador)) {
        params.inspetor_id = user.id;
      }
      if (filtros.apenas_atrasados) params.atrasados = true;
      if (filtros.apenas_abertos) params.status_not = 'encerrado';

      params.orderBy = orderBy;
      params.order = order;

      const data = await FindingsService.listar(params);
      setFindings(data || []);

      const total = data?.length || 0;
      const abertos = data?.filter(f => f.status !== 'encerrado').length || 0;
      const atrasados = data?.filter(f => f.status !== 'encerrado' && f.data_vencimento && new Date(f.data_vencimento) < new Date()).length || 0;
      const concluidos = data?.filter(f => f.status === 'encerrado').length || 0;
      setEstatisticas({ total, abertos, atrasados, concluidos });
    } catch (error) {
      console.error('Erro ao carregar findings:', error);
      setError('Erro ao carregar a lista de findings.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSliderChange = (event, newValue) => {
    setFiltros(prev => ({ ...prev, prazo_maximo: newValue }));
  };

  const aplicarFiltros = () => {
    setPage(0);
    // O useEffect com dependência [filtros] já chama carregarFindings automaticamente
  };

  const limparFiltros = () => {
    setFiltros({
      status: '',
      aerodromo_id: '',
      area_id: '',
      data_inicio: '',
      data_fim: '',
      prioridade: '',
      nivel: '',
      keyword: '',
      apenas_meus: false,
      apenas_atrasados: false,
      apenas_abertos: false,
      prazo_maximo: 30,
    });
    setSearchTerm('');
    setPage(0);
    // O useEffect com dependência [filtros] será acionado automaticamente
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      rascunho: { color: 'default', icon: <PendingIcon />, label: 'Rascunho' },
      parte1_concluida: { color: 'info', icon: <CheckCircleIcon />, label: 'Aguardando Operador' },
      aguarda_parte2: { color: 'info', icon: <PendingIcon />, label: 'Aguardando Parte 2' },
      parte2_concluida: { color: 'warning', icon: <WarningIcon />, label: 'Aguardando Avaliação' },
      aguarda_avaliacao: { color: 'warning', icon: <WarningIcon />, label: 'Aguardando Avaliação' },
      em_correcao: { color: 'error', icon: <ErrorIcon />, label: 'Em Correção' },
      encerrado: { color: 'success', icon: <CheckCircleIcon />, label: 'Encerrado' },
    };
    const config = statusConfig[status] || { color: 'default', icon: <PendingIcon />, label: status };
    return <Chip icon={config.icon} label={config.label} color={config.color} size="small" variant="outlined" />;
  };

  const getPrioridadeChip = (prioridade) => {
    const cores = { baixa: 'success', media: 'warning', alta: 'error', critica: 'error' };
    return <Chip label={prioridade?.toUpperCase() || 'N/A'} color={cores[prioridade] || 'default'} size="small" />;
  };

  const filtrarPorBusca = (findings) => {
    if (!searchTerm) return findings;
    const term = searchTerm.toLowerCase();
    return findings.filter(f =>
      f.numero_processo?.toLowerCase().includes(term) ||
      f.aerodromo?.nome?.toLowerCase().includes(term) ||
      f.aerodromo?.codigo_oaci?.toLowerCase().includes(term) ||
      f.finding_descricao?.toLowerCase().includes(term) ||
      f.inspetor?.nome_completo?.toLowerCase().includes(term)
    );
  };

  const ordenarFindings = (findings) => {
    return [...findings].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];
      if (orderBy === 'created_at' || orderBy === 'data_inspecao' || orderBy === 'data_vencimento') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      return order === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  };

  const findingsFiltrados = filtrarPorBusca(ordenarFindings([...findings]));
  const paginatedFindings = findingsFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const filtrosAtivos = Object.values(filtros).filter(v => v && v !== '' && v !== false).length;

  if (loading && findings.length === 0) {
    return (
      <Layout title="Findings">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Findings">
      {/* Cabeçalho */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1F4E79' }}>
          Gestão de Findings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Recarregar">
            <IconButton onClick={carregarFindings}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {(isInspetor || isAdmin) && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/findings/novo')}>
              Novo Finding
            </Button>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Barra de Pesquisa Rápida */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              size="small"
              placeholder="Pesquisar por número, aeródromo, descrição ou inspetor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon /></IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item>
            <Badge badgeContent={filtrosAtivos} color="primary">
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => document.getElementById('filtros-avancados').scrollIntoView({ behavior: 'smooth' })}
              >
                Filtros
              </Button>
            </Badge>
          </Grid>
        </Grid>
      </Paper>

      {/* Estatísticas Rápidas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total</Typography>
              <Typography variant="h4">{estatisticas.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Abertos</Typography>
              <Typography variant="h4" color="warning.main">{estatisticas.abertos}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Atrasados</Typography>
              <Typography variant="h4" color="error">{estatisticas.atrasados}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Concluídos</Typography>
              <Typography variant="h4" color="success.main">{estatisticas.concluidos}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros Avançados */}
      <Card variant="outlined" sx={{ mb: 3 }} id="filtros-avancados">
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Filtros Avançados</Typography>
            {filtrosAtivos > 0 && <Chip label={`${filtrosAtivos} ativos`} size="small" color="primary" sx={{ ml: 1 }} />}
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select name="status" value={filtros.status} label="Status" onChange={handleFiltroChange}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="rascunho">Rascunho</MenuItem>
                    <MenuItem value="parte1_concluida">Aguardando Operador</MenuItem>
                    <MenuItem value="parte2_concluida">Aguardando Avaliação</MenuItem>
                    <MenuItem value="encerrado">Encerrado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Aeródromo</InputLabel>
                  <Select name="aerodromo_id" value={filtros.aerodromo_id} label="Aeródromo" onChange={handleFiltroChange}>
                    <MenuItem value="">Todos</MenuItem>
                    {aerodromos.map(aero => (
                      <MenuItem key={aero.id} value={aero.id}>{aero.codigo_oaci} - {aero.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Área</InputLabel>
                  <Select name="area_id" value={filtros.area_id} label="Área" onChange={handleFiltroChange}>
                    <MenuItem value="">Todas</MenuItem>
                    {areas.map(area => (
                      <MenuItem key={area.id} value={area.id}>{area.codigo} - {area.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Prioridade</InputLabel>
                  <Select name="prioridade" value={filtros.prioridade} label="Prioridade" onChange={handleFiltroChange}>
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="baixa">Baixa</MenuItem>
                    <MenuItem value="media">Média</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField fullWidth size="small" type="date" name="data_inicio" label="Data Início" value={filtros.data_inicio} onChange={handleFiltroChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth size="small" type="date" name="data_fim" label="Data Fim" value={filtros.data_fim} onChange={handleFiltroChange} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Nível</InputLabel>
                  <Select name="nivel" value={filtros.nivel} label="Nível" onChange={handleFiltroChange}>
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="1">Nível 1</MenuItem>
                    <MenuItem value="2">Nível 2</MenuItem>
                    <MenuItem value="3">Nível 3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                {/* Placeholder vazio para alinhamento */}
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth size="small" name="keyword" label="Palavra-chave na descrição" value={filtros.keyword} onChange={handleFiltroChange} placeholder="Digite palavras para buscar na descrição..." />
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Filtros Rápidos</Typography>
                  <FormGroup row>
                    {(isInspetor || isOperador) && (
                      <FormControlLabel control={<Checkbox name="apenas_meus" checked={filtros.apenas_meus} onChange={handleFiltroChange} />} label="Apenas meus findings" />
                    )}
                    <FormControlLabel control={<Checkbox name="apenas_abertos" checked={filtros.apenas_abertos} onChange={handleFiltroChange} />} label="Apenas abertos" />
                    <FormControlLabel control={<Checkbox name="apenas_atrasados" checked={filtros.apenas_atrasados} onChange={handleFiltroChange} />} label="Apenas atrasados" />
                  </FormGroup>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>Prazo máximo (dias): {filtros.prazo_maximo}</Typography>
                <Slider value={filtros.prazo_maximo} onChange={handleSliderChange} min={1} max={90} valueLabelDisplay="auto" />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={aplicarFiltros} startIcon={<SearchIcon />}>Aplicar Filtros</Button>
                  <Button variant="outlined" onClick={limparFiltros} startIcon={<ClearIcon />}>Limpar</Button>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Card>

      {/* Tabela de Findings */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><TableSortLabel active={orderBy === 'numero_processo'} direction={orderBy === 'numero_processo' ? order : 'asc'} onClick={() => handleRequestSort('numero_processo')}>Nº Processo</TableSortLabel></TableCell>
              <TableCell><TableSortLabel active={orderBy === 'aerodromo_id'} direction={orderBy === 'aerodromo_id' ? order : 'asc'} onClick={() => handleRequestSort('aerodromo_id')}>Aeródromo</TableSortLabel></TableCell>
              <TableCell>Área</TableCell>
              <TableCell><TableSortLabel active={orderBy === 'data_inspecao'} direction={orderBy === 'data_inspecao' ? order : 'asc'} onClick={() => handleRequestSort('data_inspecao')}>Data</TableSortLabel></TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Prioridade</TableCell>
              <TableCell>Inspetor</TableCell>
              <TableCell>Prazo</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedFindings.length === 0 ? (
              <TableRow><TableCell colSpan={9} align="center">Nenhum finding encontrado</TableCell></TableRow>
            ) : (
              paginatedFindings.map((finding) => {
                const atrasado = finding.status !== 'encerrado' && finding.data_vencimento && new Date(finding.data_vencimento) < new Date();
                return (
                  <TableRow key={finding.id} hover>
                    <TableCell>{finding.numero_processo}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><FlightIcon fontSize="small" color="action" />{finding.aerodromo?.codigo_oaci}</Box>
                      <Typography variant="caption" color="textSecondary">{finding.aerodromo?.nome}</Typography>
                    </TableCell>
                    <TableCell>{finding.area_inspecao?.codigo}</TableCell>
                    <TableCell>{new Date(finding.data_inspecao).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusChip(finding.status)}</TableCell>
                    <TableCell>{getPrioridadeChip(finding.prioridade)}</TableCell>
                    <TableCell>{finding.inspetor?.nome_completo}</TableCell>
                    <TableCell>{finding.data_vencimento ? new Date(finding.data_vencimento).toLocaleDateString() : '-'}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Visualizar"><IconButton size="small" onClick={() => navigate(`/findings/${finding.id}`)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Ver Documento"><IconButton size="small" onClick={() => navigate(`/findings/${finding.id}/documento`)} color="primary"><AssignmentIcon fontSize="small" /></IconButton></Tooltip>
                        {((isInspetor || isAdmin) && finding.status === 'rascunho') && (
                          <Tooltip title="Editar"><IconButton size="small" onClick={() => navigate(`/findings/editar/${finding.id}`)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {(isOperador && finding.status === 'parte1_concluida') && (
                          <Tooltip title="Responder"><IconButton size="small" color="primary" onClick={() => navigate(`/findings/${finding.id}/responder`)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {(isInspetor && finding.status === 'parte2_concluida') && (
                          <Tooltip title="Avaliar"><IconButton size="small" color="warning" onClick={() => navigate(`/findings/${finding.id}?avaliar=true`)}><CheckCircleIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination rowsPerPageOptions={[5,10,25,50]} component="div" count={findingsFiltrados.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} labelRowsPerPage="Linhas por página" />
      </TableContainer>
    </Layout>
  );
};