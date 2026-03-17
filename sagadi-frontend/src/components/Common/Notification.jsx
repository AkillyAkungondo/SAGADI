import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';

export const notify = {
  success: (message, options = {}) => {
    toast.success(message, {
      icon: <SuccessIcon />,
      className: 'toast-success',
      ...options
    });
  },
  error: (message, options = {}) => {
    toast.error(message, {
      icon: <ErrorIcon />,
      className: 'toast-error',
      ...options
    });
  },
  warning: (message, options = {}) => {
    toast.warning(message, {
      icon: <WarningIcon />,
      className: 'toast-warning',
      ...options
    });
  },
  info: (message, options = {}) => {
    toast.info(message, {
      icon: <InfoIcon />,
      className: 'toast-info',
      ...options
    });
  }
};

export const NotificationContainer = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      style={{ zIndex: 9999 }}
    />
  );
};

export const ConfirmDialog = ({ open, onClose, onConfirm, title, message }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};