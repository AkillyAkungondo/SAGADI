import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { FindingsService } from '../services/findings';
import { AerodromosService } from '../services/aerodromos';
import { AreasInspecaoService } from '../services/areasInspecao';
import pdfService from '../services/pdfService';
import { notify } from '../components/Common/Notification';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  LinearProgress
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#8dd1e1'];

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    por_status: [],
    por_prioridade: [],
    areas_destacadas: [],
    aerodromos_destacados: [],
    prazo_medio_resposta: 0,
    tendencias: []
  });
  const [atrasados, setAtrasados] = useState([]);
  const [aerodromos, setAerodromos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [todosFindings, setTodosFindings] = useState([]);
  
  const [filtros, setFiltros] = useState({
    periodo: '30dias',
    status: 'todos',
    aerodromo_id: '',
    area_id: ''
  });
  
  const [tabValue, setTabValue] = useState(0);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dataFim = new Date();
      const dataInicio = new Date();
      
      switch(filtros.periodo) {
        case '7dias':
          dataInicio.setDate(dataInicio.getDate() - 7);
          break;
        case '30dias':
          dataInicio.setDate(dataInicio.getDate() - 30);
          break;
        case '90dias':
          dataInicio.setDate(dataInicio.getDate() - 90);
          break;
        case 'ano':
          dataInicio.setFullYear(dataInicio.getFullYear() - 1);
          break;
        default:
          dataInicio.setDate(dataInicio.getDate() - 30);
      }

      const params = {
        data_inicio: dataInicio.toISOString().split('T')[0],
        data_fim: dataFim.toISOString().split('T')[0]
      };

      if (filtros.status !== 'todos') params.status = filtros.status;
      if (filtros.aerodromo_id) params.aerodromo_id = filtros.aerodromo_id;
      if (filtros.area_id) params.area_id = filtros.area_id;

      const [stats, atrasadosData, aerodromosData, areasData, findingsData] = await Promise.all([
        FindingsService.getEstatisticas(),
        FindingsService.getAtrasados(),
        AerodromosService.listar(),
        AreasInspecaoService.getMaisUtilizadas(),
        FindingsService.listar(params)
      ]);

      setEstatisticas(stats || {
        total: 0,
        por_status: [],
        por_prioridade: [],
        areas_destacadas: [],
        aerodromos_destacados: [],
        prazo_medio_resposta: 0
      });
      
      setAtrasados(atrasadosData || []);
      setAerodromos(aerodromosData || []);
      setAreas(areasData || []);
      setTodosFindings(findingsData || []);
      
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const exportarParaCSV = () => {
    setExportando(true);
    try {
      const dadosExport = todosFindings.map(f => ({
        'Nº Processo': f.numero_processo,
        'Aeródromo': f.aerodromo?.codigo_oaci,
        'Área': f.area_inspecao?.codigo,
        'Status': f.status,
        'Prioridade': f.prioridade,
        'Data Inspeção': new Date(f.data_inspecao).toLocaleDateString(),
        'Inspetor': f.inspetor?.nome_completo,
        'Data Vencimento': f.data_vencimento ? new Date(f.data_vencimento).toLocaleDateString() : ''
      }));
      
      const csv = dadosExport.map(row => Object.values(row).join(';')).join('\n');
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `findings_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      notify.success('Ficheiro CSV exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      notify.error('Erro ao exportar CSV.');
    } finally {
      setExportando(false);
    }
  };

  const gerarRelatorioPDF = async () => {
    try {
      setExportando(true);
      notify.info('Preparando relatório PDF...');
      
      if (!todosFindings || todosFindings.length === 0) {
        notify.warning('Não há dados para gerar relatório.');
        setExportando(false);
        return;
      }

      const periodoTexto = {
        '7dias': 'Últimos 7 dias',
        '30dias': 'Últimos 30 dias',
        '90dias': 'Últimos 90 dias',
        'ano': 'Último ano'
      }[filtros.periodo] || filtros.periodo;
      
      await pdfService.downloadRelatorioFindings(
        todosFindings, 
        'dashboard-relatorio', 
        {
          titulo: 'Relatório do Dashboard',
          periodo: periodoTexto
        }
      );
      
      notify.success('Relatório PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao gerar PDF:', error);
      notify.error(`Erro ao gerar PDF: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setExportando(false);
    }
  };

  const exportarParaExcel = async () => {
    try {
      setExportando(true);
      notify.info('Preparando exportação para Excel...');
      await pdfService.exportarParaExcel(todosFindings);
      notify.success('Ficheiro Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      notify.error('Erro ao exportar para Excel.');
    } finally {
      setExportando(false);
    }
  };

  const dadosTendencia = todosFindings.reduce((acc, finding) => {
    const data = new Date(finding.data_inspecao).toLocaleDateString();
    const existing = acc.find(item => item.data === data);
    if (existing) {
      existing.total++;
      existing[finding.status] = (existing[finding.status] || 0) + 1;
    } else {
      acc.push({
        data,
        total: 1,
        [finding.status]: 1
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.data) - new Date(b.data));

  const dadosPorAerodromo = aerodromos.map(aero => ({
    name: aero.codigo_oaci,
    value: todosFindings.filter(f => f.aerodromo_id === aero.id).length
  })).filter(item => item.value > 0);

  if (loading && !todosFindings.length) {
    return (
      <Layout title="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={exportarParaCSV} 
            disabled={exportando}
          >
            CSV
          </Button>
          
          <Button 
            variant="outlined" 
            size="small" 
            onClick={gerarRelatorioPDF} 
            disabled={exportando}
          >
            PDF
          </Button>
          
          <Button 
            variant="outlined" 
            size="small" 
            onClick={exportarParaExcel} 
            disabled={exportando}
          >
            Excel
          </Button>

          <Button 
            variant="outlined" 
            size="small" 
            onClick={carregarDados}
          >
            Recarregar
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select name="periodo" value={filtros.periodo} label="Período" onChange={handleFiltroChange}>
                <MenuItem value="7dias">Últimos 7 dias</MenuItem>
                <MenuItem value="30dias">Últimos 30 dias</MenuItem>
                <MenuItem value="90dias">Últimos 90 dias</MenuItem>
                <MenuItem value="ano">Último ano</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select name="status" value={filtros.status} label="Status" onChange={handleFiltroChange}>
                <MenuItem value="todos">Todos</MenuItem>
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
                  <MenuItem key={aero.id} value={aero.id}>
                    {aero.codigo_oaci} - {aero.nome}
                  </MenuItem>
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
                  <MenuItem key={area.id} value={area.id}>
                    {area.codigo} - {area.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Visão Geral" />
          <Tab label="Tendências" />
          <Tab label="Desempenho" />
          <Tab label="Detalhado" />
        </Tabs>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total de Findings</Typography>
                <Typography variant="h3">{estatisticas?.total || 0}</Typography>
                <Typography variant="caption" color="textSecondary">No período selecionado</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Prazo Médio</Typography>
                <Typography variant="h3">{Math.round(estatisticas?.prazo_medio_resposta || 0)}</Typography>
                <Typography variant="caption" color="textSecondary">Dias para resposta</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Abertos</Typography>
                <Typography variant="h3" color="warning.main">
                  {todosFindings.filter(f => f.status !== 'encerrado').length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {((todosFindings.filter(f => f.status !== 'encerrado').length / (estatisticas?.total || 1)) * 100).toFixed(1)}% do total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Atrasados</Typography>
                <Typography variant="h3" color="error">{atrasados.length}</Typography>
                <Typography variant="caption" color="textSecondary">
                  {atrasados.length > 0 ? 'Requer atenção' : 'Nenhum atrasado'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography variant="h6" gutterBottom align="center" sx={{ fontSize: '1rem', mb: 1 }}>
                Distribuição por Status
              </Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={estatisticas?.por_status?.map(item => ({
                        name: 
                          item.status === 'parte1_concluida' ? 'Aguardando Operador' :
                          item.status === 'parte2_concluida' ? 'Aguardando Avaliação' :
                          item.status === 'encerrado' ? 'Encerrado' :
                          item.status === 'rascunho' ? 'Rascunho' :
                          item.status || 'Desconhecido',
                        value: item._count || 0
                      })) || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(estatisticas?.por_status || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} findings`, 'Quantidade']} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography variant="h6" gutterBottom align="center" sx={{ fontSize: '1rem', mb: 1 }}>
                Distribuição por Prioridade
              </Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart 
                    data={estatisticas?.por_prioridade?.map(item => ({
                      name: 
                        item.prioridade === 'alta' ? 'Alta' :
                        item.prioridade === 'media' ? 'Média' :
                        item.prioridade === 'baixa' ? 'Baixa' :
                        item.prioridade || 'Desconhecido',
                      value: item._count || 0
                    })) || []}
                    layout="vertical"
                    margin={{ left: 50, right: 10, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={60} />
                    <RechartsTooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {(estatisticas?.por_prioridade || []).map((entry) => (
                        <Cell key={`cell-${entry.prioridade}`} fill={
                          entry.prioridade === 'alta' ? '#ff8042' :
                          entry.prioridade === 'media' ? '#ffc658' :
                          entry.prioridade === 'baixa' ? '#00c49f' : '#8884d8'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography variant="h6" gutterBottom align="center" sx={{ fontSize: '1rem', mb: 1 }}>
                Top Aeródromos
              </Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart
                    layout="vertical"
                    data={estatisticas?.aerodromos_destacados?.slice(0, 5) || []}
                    margin={{ left: 50, right: 10, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="aerodromo" width={50} />
                    <RechartsTooltip />
                    <Bar dataKey="total" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography variant="h6" gutterBottom align="center" sx={{ fontSize: '1rem', mb: 1 }}>
                Top Áreas de Inspeção
              </Typography>
              <Box sx={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart
                    layout="vertical"
                    data={areas?.slice(0, 5) || []}
                    margin={{ left: 70, right: 10, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="area" width={70} />
                    <RechartsTooltip />
                    <Bar dataKey="total" fill="#8884d8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom align="center">
                Evolução de Findings
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosTendencia.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                  <Line type="monotone" dataKey="encerrado" stroke="#82ca9d" name="Encerrados" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Taxa de Encerramento</Typography>
                <Typography variant="h2">
                  {((todosFindings.filter(f => f.status === 'encerrado').length / (estatisticas?.total || 1)) * 100).toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(todosFindings.filter(f => f.status === 'encerrado').length / (estatisticas?.total || 1)) * 100} 
                  sx={{ mt: 2, height: 10, borderRadius: 5 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Cumprimento de Prazos</Typography>
                <Typography variant="h2">
                  {((todosFindings.filter(f => f.data_vencimento && new Date(f.data_vencimento) >= new Date()).length / (estatisticas?.total || 1)) * 100).toFixed(1)}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={((todosFindings.filter(f => f.data_vencimento && new Date(f.data_vencimento) >= new Date()).length / (estatisticas?.total || 1)) * 100)} 
                  sx={{ mt: 2, height: 10, borderRadius: 5 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Eficiência Inspetores</Typography>
                <Typography variant="h2">
                  {Math.round(todosFindings.length / (new Set(todosFindings.map(f => f.inspetor_id)).size || 1))}
                </Typography>
                <Typography variant="caption">Findings por inspetor</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 3 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Lista Detalhada de Findings
          </Typography>
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nº Processo</TableCell>
                  <TableCell>Aeródromo</TableCell>
                  <TableCell>Área</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Data Inspeção</TableCell>
                  <TableCell>Inspetor</TableCell>
                  <TableCell>Vencimento</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {todosFindings.slice(0, 50).map((finding) => (
                  <TableRow key={finding.id} hover>
                    <TableCell>{finding.numero_processo}</TableCell>
                    <TableCell>{finding.aerodromo?.codigo_oaci}</TableCell>
                    <TableCell>{finding.area_inspecao?.codigo}</TableCell>
                    <TableCell>
                      <Chip 
                        label={finding.status === 'parte1_concluida' ? 'Aguardando Operador' :
                               finding.status === 'parte2_concluida' ? 'Aguardando Avaliação' :
                               finding.status === 'encerrado' ? 'Encerrado' :
                               finding.status === 'rascunho' ? 'Rascunho' :
                               finding.status || 'Desconhecido'} 
                        size="small"
                        color={
                          finding.status === 'encerrado' ? 'success' :
                          finding.status === 'parte1_concluida' ? 'info' :
                          finding.status === 'parte2_concluida' ? 'warning' :
                          finding.status === 'rascunho' ? 'default' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={finding.prioridade === 'alta' ? 'Alta' :
                               finding.prioridade === 'media' ? 'Média' :
                               finding.prioridade === 'baixa' ? 'Baixa' :
                               finding.prioridade || 'N/A'} 
                        size="small"
                        color={
                          finding.prioridade === 'alta' ? 'error' :
                          finding.prioridade === 'media' ? 'warning' : 'success'
                        }
                      />
                    </TableCell>
                    <TableCell>{new Date(finding.data_inspecao).toLocaleDateString()}</TableCell>
                    <TableCell>{finding.inspetor?.nome_completo}</TableCell>
                    <TableCell>
                      {finding.data_vencimento ? new Date(finding.data_vencimento).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Layout>
  );
};