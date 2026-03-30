import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FindingsService } from '../../services/findings';
import { CircularProgress, Alert, Box, Button } from '@mui/material';
import html2pdf from 'html2pdf.js';

export const FindingDocumentPrint = () => {
  const { id } = useParams();
  const [finding, setFinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const data = await FindingsService.buscarPorId(id);
      setFinding(data);
    } catch {
      setError('Erro ao carregar');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('print-area');

    html2pdf().set({
      margin: 10,
      filename: `finding_${finding?.numero_processo || 'document'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 1 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(element).save();
  };

  if (loading) return <CircularProgress />;
  if (error || !finding) return <Alert severity="error">{error}</Alert>;

  const fill = (v) => v || '[Text]';

  const acoes = [...(finding.acoes_corretivas || [])];
  while (acoes.length < 4) acoes.push({});

  const progressos = [...(finding.progress_documented || [])];
  while (progressos.length < 4) progressos.push({});

  const cell = {
    border: '1px solid black',
    padding: '4px',
    fontSize: '11pt',
    fontFamily: 'Calibri, Arial, sans-serif',
    verticalAlign: 'top',
    lineHeight: '1.3'
  };

  const header = {
    ...cell,
    backgroundColor: '#B7DEE8',
    textAlign: 'center',
    fontWeight: 'bold'
  };

  const inputRow = (h = 30) => ({ ...cell, height: h });

  return (
    <Box sx={{ width: '210mm', margin: 'auto', bgcolor: '#fff', p: 1 }}>

      <Button variant="contained" onClick={handleExportPDF} sx={{ mb: 2 }}>
        Export as PDF
      </Button>

      <div id="print-area">

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid black' }}>
          <tbody>

            {/* TITLE */}
            <tr >
              <td    colSpan="7"
    style={{
      ...header,
      ...cell,
      textAlign: 'center',
      fontWeight: 'bold',
    }}>
                RECORD OF AERODROME INSPECTION FINDINGS
              </td>
            </tr>

            {/* PART 1 (UNCHANGED STRUCTURE) */}
            <tr><td colSpan="7" style={header}>PART 1 : To be completed by the Aerodrome inspector</td></tr>

           <tr>
            <td colSpan="4" style={cell}>
              <b>Aerodrome:</b>
              {finding.aerodromo?.nome || '[Text]'}
            </td>
            <td colSpan="3" style={cell}>
              <b>Finding Number:</b>
              {finding.numero_processo || '[Text]'}
            </td>
          </tr>

          <tr>
            <td colSpan="4" style={cell}>
              <b>Area of inspection:</b> 
              {finding.area_inspecao?.nome || '[Text]'}
            </td>
            <td colSpan="3" style={cell}>
              <b>Date:</b>
              {finding.data_inspecao ? new Date(finding.data_inspecao).toLocaleDateString() : '[Text]'}
            </td>
          </tr>

          <tr>
            <td colSpan="4" style={cell}>
              <b>Name of the Inspector:</b>
              {finding.inspetor?.nome_completo || '[Text]'}
            </td>
            <td colSpan="3" style={cell}>
              <b>Finding Level:</b>
              {finding.finding_level || '[Text]'}
            </td>
          </tr>

            {/* REFERENCE */}
            <tr><td colSpan="7" style={header}>REFERENCE DOCUMENT</td></tr>
            <tr><td colSpan="7" style={inputRow(30)}>{fill(finding.reference_document)}</td></tr>

            {/* FINDING */}
            <tr><td colSpan="7" style={header}>FINDING</td></tr>
            <tr><td colSpan="7" style={inputRow(30)}>{fill(finding.finding_descricao)}</td></tr>

            {/* PART 2 */}
            <tr><td colSpan="7" style={header}>PART 2 : To be completed by the Aerodrome Operator</td></tr>

            <tr><td colSpan="7" style={header}>OBSERVATIONS and REMARKS -- Aerodrome Operator</td></tr>
            <tr><td colSpan="7" style={inputRow(35)}>{fill(finding.observacoes_operador)}</td></tr>

            <tr><td colSpan="7" style={header}>ROOT CAUSE (S)</td></tr>
            <tr><td colSpan="7" style={inputRow(35)}>{fill(finding.root_causes)}</td></tr>

            {/* PROPOSED ACTIONS */}
            <tr><td colSpan="7" style={header}>PROPOSED CORRECTIVE ACTION(S)</td></tr>
          

            <tr>
              <td style={header}></td>
              <td style={header}>PROPOSED CORRECTIVE ACTION(S)</td>
              <td style={header}>OFFICE ACTION</td>
              <td style={header}>EVIDENCE REFERENCE</td>
              <td style={header}>STARTING DATE</td>
              <td style={header}>DUE DATE(S)</td>
              <td style={header}>PROGRESS (%)</td>
            </tr>

            {acoes.map((a, i) => (
              <tr key={i}>
                <td style={{ ...cell, textAlign: 'center' }}>{i + 1}.</td>
                <td style={cell}>{a.acao || ''}</td>
                <td style={cell}>{a.office_action || ''}</td>
                <td style={cell}>{a.evidence_ref || ''}</td>
                <td style={cell}>{a.start_date ? new Date(a.start_date).toLocaleDateString() : ''}</td>
                <td style={cell}>{a.due_date ? new Date(a.due_date).toLocaleDateString() : ''}</td>
                <td style={cell}>{a.progress || ''}</td>
              </tr>
            ))}

            {/* PART 3 */}
            <tr><td colSpan="7" style={header}>PART 3 : To be completed by the IACM</td></tr>

            <tr><td colSpan="7" style={header}>COMMENTS ON THE CAP</td></tr>
            <tr><td colSpan="7" style={inputRow(35)}>{fill(finding.comments_cap)}</td></tr>

            {/* PROGRESS */}
            <tr>
              <td colSpan="5" style={header}>PROGRESS DOCUMENTED</td>
              <td colSpan="2" style={header}>REVIEW DATE</td>
            </tr>

            {progressos.map((p, i) => (
              <tr key={i}>
                <td style={{ ...cell, textAlign: 'center' }}>{i + 1}.</td>
                <td colSpan="4" style={cell}>{p.descricao || ''}</td>
                <td colSpan="2" style={cell}>{p.review_date ? new Date(p.review_date).toLocaleDateString() : ''}</td>
              </tr>
            ))}

            {/* EVALUATION FIXED */}
            <tr>
              <td colSpan="5" style={header}>
                EVALUATION OF CORRECTIVE ACTIONS PUT IN PLACE
              </td>
              <td colSpan="3" style={header}>
                DATE(S) OF APPLICATION OF CORRECTIVE ACTION(S)
              </td>
            </tr>
            <tr>
              <td colSpan="5" style={inputRow(30)}>
                {fill(finding.evaluation_actions)}
              </td>
              <td colSpan="3" style={inputRow(30)}>
                {finding.data_aplicacao_acoes
                  ? new Date(finding.data_aplicacao_acoes).toLocaleDateString()
                  : '[Text]'}
              </td>
            </tr>

            {/* RESOLUTION */}
            <tr>
              <td colSpan="7" style={cell}>
                This finding has been resolved satisfactorily:
                <span style={{ marginLeft: '20px' }}>Yes ☐   No ☐</span>
              </td>
            </tr>

            {/* SIGNATURE */}
            <tr>
              <td colSpan="7" style={{ ...cell, textAlign: 'center', paddingTop: '30px' }}>
                ___________________________________________<br />
                IACM Inspector's Name and Signature
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <style>
        {`
          @page { size: A4; margin: 1cm; }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        `}
      </style>
    </Box>
  );
};