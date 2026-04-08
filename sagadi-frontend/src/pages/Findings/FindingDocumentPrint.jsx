import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FindingsService } from '../../services/findings';
import { CircularProgress, Alert, Box, Typography } from '@mui/material';

export const FindingDocumentPrint = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finding, setFinding] = useState(null);

  useEffect(() => {
    carregarFinding();
  }, [id]);

  const carregarFinding = async () => {
    try {
      setLoading(true);
      const data = await FindingsService.buscarPorId(id);
      setFinding(data);
    } catch (error) {
      console.error('Erro ao carregar finding:', error);
      setError('Erro ao carregar detalhes do finding');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !finding) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Finding não encontrado'}</Alert>
      </Box>
    );
  }

  const acoes = [...(finding.acoes_corretivas || [])];
  while (acoes.length < 4) acoes.push({ acao: '', office_action: '', evidence_ref: '', start_date: '', due_date: '', progress: '' });
  const progressos = [...(finding.progress_documented || [])];
  while (progressos.length < 4) progressos.push({ descricao: '', review_date: '' });

  const headerStyle = { backgroundColor: '#D9E1F2', borderBottom: '1px solid #000000', padding: '8px', textAlign: 'left', fontSize: '14pt', fontWeight: 'bold', color: '#1F4E79' };
  const cellStyle = { border: '1px solid #000000', padding: '8px', verticalAlign: 'top' };

  return (
    <Box sx={{ p: 4, maxWidth: '210mm', mx: 'auto', bgcolor: 'white', fontFamily: 'Arial, sans-serif' }}>
      {/* Título central */}
      <Typography variant="h4" align="center" sx={{ fontWeight: 'bold', mb: 3, color: '#1F4E79', fontSize: '18pt' }}>
        RECORD OF AERODROME INSPECTION FINDINGS
      </Typography>

      {/* PARTE 1 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000000' }}>
        <thead>
          <tr><th colSpan="2" style={headerStyle}>PARTE 1 : To be completed by the Aerodrome inspector</th></tr>
        </thead>
        <tbody>
          <tr>
            <td style={cellStyle}><strong>Aerodrome:</strong><br />{finding.aerodromo?.codigo_oaci} - {finding.aerodromo?.nome}</td>
            <td style={cellStyle}><strong>Finding Number:</strong><br />{finding.numero_processo}</td>
          </tr>
          <tr>
            <td style={cellStyle}><strong>Area of inspection:</strong><br />{finding.area_inspecao?.codigo} - {finding.area_inspecao?.nome}</td>
            <td style={cellStyle}><strong>Date:</strong><br />{new Date(finding.data_inspecao).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style={cellStyle}><strong>Name of the Inspector:</strong><br />{finding.inspetor?.nome_completo}</td>
            <td style={cellStyle}><strong>Finding Level:</strong><br />{finding.finding_level}</td>
          </tr>
          <tr>
            <td colSpan="2" style={cellStyle}><strong>REFERENCE DOCUMENT</strong><br />{finding.reference_document || ''}</td>
          </tr>
          <tr>
            <td colSpan="2" style={cellStyle}><strong>FINDING</strong><br />{finding.finding_descricao || ''}</td>
          </tr>
        </tbody>
      </table>

      {/* PARTE 2 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000000' }}>
        <thead><tr><th style={headerStyle}>PARTE 2 : To be completed by the Aerodrome Operator</th></tr></thead>
        <tbody>
          <tr><td style={cellStyle}><strong>OBSERVATIONS and REMARKS -- Aerodrome Operator</strong><br />{finding.observacoes_operador || ''}</td></tr>
          <tr><td style={cellStyle}><strong>ROOT CAUSE (S)</strong><br />{finding.root_causes || ''}</td></tr>
          <tr><td style={cellStyle}><strong>PROPOSED CORRECTIVE ACTION(S)</strong><br /><span style={{ fontSize: '10pt', fontStyle: 'italic' }}>(To explain the short term and long term measures that will be taken to eliminate the deficiency and its reoccurrence).</span></td></tr>
          <tr>
            <td style={cellStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F2F2F2' }}>
                    <th style={{ border: '1px solid #000', padding: '6px' }}>PROPOSED CORRECTIVE ACTION(S)</th>
                    <th style={{ border: '1px solid #000', padding: '6px' }}>OFFICE ACTION</th>
                    <th style={{ border: '1px solid #000', padding: '6px' }}>EVIDENCE REFERENCE</th>
                    <th style={{ border: '1px solid #000', padding: '6px' }}>STARTING DATE</th>
                    <th style={{ border: '1px solid #000', padding: '6px' }}>DUE DATE(S)</th>
                    <th style={{ border: '1px solid #000', padding: '6px' }}>PROGRESS (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {acoes.map((acao, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{acao.acao}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{acao.office_action}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{acao.evidence_ref}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{acao.start_date ? new Date(acao.start_date).toLocaleDateString() : ''}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{acao.due_date ? new Date(acao.due_date).toLocaleDateString() : ''}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{acao.progress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* PARTE 3 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1px solid #000000' }}>
        <thead><tr><th style={headerStyle}>PARTE 3 : To be completed by the IACM</th></tr></thead>
        <tbody>
          <tr><td style={cellStyle}><strong>FOLLOW-UP ON CORRECTIVE ACTIONS</strong></td></tr>
          <tr><td style={cellStyle}><strong>COMMENTS ON THE CAP</strong><br />{finding.comments_cap || ''}</td></tr>
          <tr><td style={cellStyle}><strong>PROGRESS DOCUMENTED</strong>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
              <thead><tr><th style={{ border: '1px solid #000', padding: '6px', width: '70%' }}>PROGRESS DOCUMENTED</th><th style={{ border: '1px solid #000', padding: '6px', width: '30%' }}>REVIEW DATE</th></tr></thead>
              <tbody>
                {progressos.map((prog, idx) => (
                  <tr key={idx}><td style={{ border: '1px solid #000', padding: '6px' }}>{prog.descricao}</td><td style={{ border: '1px solid #000', padding: '6px' }}>{prog.review_date ? new Date(prog.review_date).toLocaleDateString() : ''}</td></tr>
                ))}
              </tbody>
            </table>
          </td></tr>
          <tr>
            <td style={cellStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}><strong>EVALUATION OF CORRECTIVE ACTIONS PUT IN PLACE</strong><br />{finding.evaluation_actions || ''}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', width: '50%' }}><strong>DATE(S) OF APPLICATION OF CORRECTIVE ACTION(S)</strong><br />{finding.data_aplicacao_acoes ? new Date(finding.data_aplicacao_acoes).toLocaleDateString() : ''}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr><td style={cellStyle}><strong>This finding has been resolved satisfactorily:</strong><br />{finding.resolved_satisfactorily ? 'Yes' : 'No'}</td></tr>
          <tr><td style={cellStyle}><strong>IACM Inspector's Name and Signature</strong><br />{finding.inspector_assinatura?.nome_completo || ''}{finding.data_assinatura && <span style={{ display: 'block', fontSize: '10pt' }}>({new Date(finding.data_assinatura).toLocaleString()})</span>}</td></tr>
        </tbody>
      </table>

      {/* Rodapé */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">Documento gerado pelo SAGADI - Sistema de Análise, Gestão e Arquivo Digital de Inspeções</Typography>
        <Typography variant="caption" color="textSecondary" display="block">IACM - Instituto de Aviação Civil de Moçambique</Typography>
      </Box>
    </Box>
  );
};