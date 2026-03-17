import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon
} from '@mui/icons-icons';

export const FilePreview = ({ open, onClose, file }) => {
  const [loading, setLoading] = useState(true);

  const getFileType = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const renderPreview = () => {
    if (!file) return null;

    const fileType = getFileType(file.nome_original);

    switch (fileType) {
      case 'image':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={`http://localhost:3000/${file.caminho}`}
              alt={file.nome_original}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
              onLoad={() => setLoading(false)}
            />
          </Box>
        );
      
      case 'pdf':
        return (
          <iframe
            src={`http://localhost:3000/${file.caminho}`}
            width="100%"
            height="600px"
            title={file.nome_original}
            onLoad={() => setLoading(false)}
          />
        );
      
      default:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <DocIcon sx={{ fontSize: 80, color: 'text.secondary' }} />
            <Typography variant="h6" gutterBottom>
              Pré-visualização não disponível
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {file.nome_original}
            </Typography>
            <Button
              variant="contained"
              href={`http://localhost:3000/${file.caminho}`}
              download
              sx={{ mt: 2 }}
            >
              Download
            </Button>
          </Box>
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{file?.nome_original}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {renderPreview()}
      </DialogContent>
    </Dialog>
  );
};