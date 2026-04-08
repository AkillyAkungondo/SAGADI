import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { FindingsService } from '../services/findings';
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmberRounded';
import DashboardIcon from '@mui/icons-material/DashboardRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import BarChartIcon from '@mui/icons-material/BarChartRounded';
import PieChartOutlineRoundedIcon from '@mui/icons-material/PieChartOutlineRounded';
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const primary = '#1F4E79';
const danger = '#D32F2F';
const warning = '#ED6C02';
const success = '#2E7D32';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({});
  const [todosFindings, setTodosFindings] = useState([]);
  const [atrasados, setAtrasados] = useState([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const [stats, findings, atrasadosData] = await Promise.all([
        FindingsService.getEstatisticas(),
        FindingsService.listar(),
        FindingsService.getAtrasados()
      ]);
      setEstatisticas(stats || {});
      setTodosFindings(findings || []);
      setAtrasados(atrasadosData || []);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} thickness={4} sx={{ color: primary }} />
        </Box>
      </Layout>
    );
  }

  const abertos = todosFindings.filter(f => f.status !== 'encerrado').length;
  const encerrados = todosFindings.filter(f => f.status === 'encerrado').length;
  const taxaEncerramento = ((encerrados / (todosFindings.length || 1)) * 100).toFixed(1);

  const pieData = estatisticas.por_status || [];
  const barData = estatisticas.por_prioridade || [];

  // Tradução dos status
  const traduzirStatus = (status) => {
    const map = {
      'encerrado': 'Encerrado',
      'parte1_concluida': 'Aguardando Operador',
      'parte2_concluida': 'Aguardando Avaliação',
      'rascunho': 'Rascunho',
      'aguarda_parte2': 'Aguardando Parte 2',
      'aguarda_avaliacao': 'Aguardando Avaliação',
      'em_correcao': 'Em Correção'
    };
    return map[status] || status;
  };

  // Tradução das prioridades
  const traduzirPrioridade = (prioridade) => {
    const map = {
      'alta': 'Alta',
      'media': 'Média',
      'baixa': 'Baixa',
      'critica': 'Crítica'
    };
    return map[prioridade] || prioridade;
  };

  return (
    <Layout title="Dashboard">
      <Box>
        {/* Título */}
        <Typography variant="h4" sx={{ fontWeight: 600, color: primary, mb: 3 }}>
          Painel de Controle Operacional
        </Typography>

        {/* Alerta de atrasos */}
        {atrasados.length > 0 && (
          <Alert
            icon={<WarningAmberIcon />}
            severity="error"
            sx={{ mb: 4, borderRadius: 2 }}
            action={<IconButton size="small" onClick={carregar} sx={{ color: 'error.main' }}><TrendingUpRoundedIcon /></IconButton>}
          >
            {atrasados.length} finding(s) atrasado(s) requerem atenção imediata.
          </Alert>
        )}

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <DashboardIcon sx={{ color: primary, fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.secondary' }}>Total Findings</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: primary }}>{todosFindings.length.toLocaleString()}</Typography>
                <Typography variant="body2" color="text.secondary">Período atual</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <PriorityHighRoundedIcon sx={{ color: warning, fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.secondary' }}>Abertos</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: warning }}>{abertos.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <TrendingUpRoundedIcon sx={{ color: success, fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.secondary' }}>Encerrados</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: success }}>{encerrados.toLocaleString()}</Typography>
                <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>{taxaEncerramento}% resolvidos</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <WarningAmberIcon sx={{ color: danger, fontSize: 32 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.secondary' }}>Atrasados</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: danger }}>{atrasados.length.toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }} textColor="primary" indicatorColor="primary">
          <Tab icon={<PieChartOutlineRoundedIcon />} label="Visão Geral" />
          <Tab icon={<BarChartIcon />} label="Risco" />
        </Tabs>

        {/* Conteúdo das Tabs - Visão Geral */}
        {tab === 0 && (
          <Grid container spacing={4}>
            {/* Gráfico de Status */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Distribuição por Status</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                   <PieChart>
  <Pie
    data={pieData.map(item => ({
      name: traduzirStatus(item.status),
      value: item._count || 0
    }))}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={80}
    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
    labelLine={false}
  >
    {pieData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={['#1F4E79', '#ED6C02', '#2E7D32', '#FBC02D'][index % 4]} />
    ))}
  </Pie>
  <Tooltip formatter={(value, name) => [`${value} findings`, name]} />
  <Legend />
</PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Gráfico de Prioridade */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Findings por Prioridade</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={barData.map(item => ({
                        name: traduzirPrioridade(item.prioridade),
                        value: item._count || 0
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} findings`, 'Quantidade']} />
                      <Bar dataKey="value" fill={primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Conteúdo das Tabs - Risco */}
        {tab === 1 && (
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Indicador de Risco Global</Typography>
                  <Box sx={{ position: 'relative', mt: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((atrasados.length / (todosFindings.length || 1)) * 100, 100)}
                      sx={{
                        height: 20,
                        borderRadius: 2,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': { borderRadius: 2, backgroundColor: danger },
                      }}
                    />
                    <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', textShadow: '0 0 4px rgba(0,0,0,0.5)' }}>
                      {((atrasados.length / (todosFindings.length || 1)) * 100).toFixed(1)}%
                    </Box>
                  </Box>
                  <Typography sx={{ mt: 3, fontWeight: 500 }}>{atrasados.length} de {todosFindings.length} findings em risco de atraso</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Layout>
  );
};