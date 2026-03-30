import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationContainer } from "./components/Common/Notification";
import { AnimatePresence } from "framer-motion";

// Importar páginas
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { FindingsList } from "./pages/Findings/FindingsList";
import { CreateFinding } from "./pages/Findings/CreateFinding";
import { FindingDetail } from "./pages/Findings/FindingDetail";
import { FindingDocumentPage } from "./pages/Findings/FindingDocumentPage";
import { UsersPage } from "./pages/Admin/UsersPage";
import { AerodromosPage } from "./pages/Aerodromos/AerodromosPage";
import { AreasInspecaoPage } from "./pages/AreasInspecao/AreasInspecaoPage";
import { PerfilPage } from "./pages/Perfil/PerfilPage";
import { ResponderFinding } from "./pages/Findings/ResponderFinding";
import { FindingDocumentPrint } from "./pages/Findings/FindingDocumentPrint";

// Tema claro padrão
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/findings"
          element={
            <PrivateRoute>
              <FindingsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/findings/novo"
          element={
            <PrivateRoute>
              <CreateFinding />
            </PrivateRoute>
          }
        />
        <Route
          path="/findings/:id"
          element={
            <PrivateRoute>
              <FindingDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/findings/:id/responder"
          element={
            <PrivateRoute>
              <ResponderFinding />
            </PrivateRoute>
          }
        />
        <Route
          path="/findings/:id/documento"
          element={
            <PrivateRoute>
              <FindingDocumentPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/aerodromos"
          element={
            <PrivateRoute>
              <AerodromosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/areas-inspecao"
          element={
            <PrivateRoute>
              <AreasInspecaoPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <PerfilPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/findings/:id/documento/print"
          element={
            <PrivateRoute>
              <FindingDocumentPrint />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
      <NotificationContainer />
    </ThemeProvider>
  );
}

export default App;
