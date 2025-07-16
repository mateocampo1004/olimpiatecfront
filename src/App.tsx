import { useState, useEffect } from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import Panel from "./pages/Panel";
import TeamPanel from "./pages/TeamPanel";
import TeamPlayers from "./pages/representant/TeamPlayers";
import ProtectedRoute from "./components/ProtectedRoutes";
import PlayerForm from "./pages/PlayerForm";
import Unauthorized from "./pages/Unauthorized";
import MyTeamPanel from "./pages/representant/MyTeamPanel";
import { jwtDecode } from "jwt-decode";
import PlayerFormRepresentante from "./pages/representant/PlayerFormRepresentante";
import RegulationAdminPanel from "./pages/RegulationAdminPanel";
import RegulationViewer from "./pages/public/RegulationViewer";
import MatchesPublic from "./pages/public/MatchesPublic";
import MatchFormCreate from "./pages/MatchFormCreate";
import MyMatches from "./pages/representant/my-matches";
import MatchReportForm from "./pages/representant/matchreportform";
import GlobalStats from "./pages/Stats/GlobalStats";
import MatchEvents from "./pages/MatchEvents";
import ResultsPublic from "./pages/public/ResultsPublic";
import PlayerStatsPanel from "./pages/players/PlayerStatsPanel";
import PlayerProfile from "./pages/players/PlayerProfile";
import CampeonatoPublicPanel from "./pages/campeonato/CampeonatoPublicPanel";
import ReportesPanel from "./pages/reports/ReportesPanel";
import ValidationPanel from "./pages/ValidationPanel";
import HistoryPanel from "./pages/HistoryPanel";
import AuditLogsPanel from "./pages/AuditLogsPanel";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import ResetPasswordForm from "./components/ResetPasswordForm";

// Utils
interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  role: string;
}

const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const now = Date.now() / 1000;
    return !!decoded.exp && decoded.exp > now;
  } catch {
    return false;
  }
};

export default function App() {
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && isTokenValid(token)) {
      const payload: JwtPayload = jwtDecode(token);
      setRole(payload.role);
    } else {
      // Si el token es inválido o expiró, bórralo
      localStorage.removeItem("token");
      setRole("");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setRole("");
    window.location.href = "/campeonato";
  };

  return (
    <Router>
      <nav className="navbar">
        <div className="navbar-links">
          {/* ADMIN */}
          {role === "ADMIN" && (
            <div className="dropdown">
              <button className="dropdown-button">Administración</button>
              <div className="dropdown-content">
                <Link to="/panel">Gestión Usuarios</Link>
                <Link to="/teams">Gestión Equipos</Link>
                <Link to="/players/form">Gestión Jugadores</Link>
                <Link to="/regulations/admin">Gestión Reglamento</Link>
                <Link to="/matches/create">Programar Partido</Link>
                <Link to="/reportes">Generar Reportes</Link>
                <Link to="/admin/validacion">Validación</Link>
                <Link to="/admin/historial-validacion">Historial Validación</Link>
                <Link to="/admin/logs">Logs de Auditoría</Link>
              </div>
            </div>
          )}

          {/* JUGADOR */}
          {role === "JUGADOR" && (
            <>
              <Link to="/my-team">Mi equipo</Link>
              <Link to="/my-team/create-player">Gestión Jugadores</Link>
              <Link to="/my-matches">Mis Partidos</Link>
            </>
          )}
          {/* MESA */}
          {role === "MESA" && (
            <>
              <Link to="/matches">Registrar Eventos</Link>
            </>
          )}
          {/* Público */}
          <Link to="/reglamento">Reglamento</Link>
          <Link to="/campeonato">Campeonato</Link>
        </div>

        {role ? (
          <button className="btn-secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        ) : (
          <Link to="/login">
            <button className="btn-primary">Iniciar sesión</button>
          </Link>
        )}
      </nav>

      <Routes>
        {/* Rutas públicas */}
        <Route path="/reglamento" element={<RegulationViewer />} />
        <Route path="/player/:playerId" element={<PlayerProfile />} />
        <Route path="/campeonato/*" element={<CampeonatoPublicPanel />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm/>}/>
        {/* Rutas privadas */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/panel" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Panel /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute allowedRoles={["ADMIN"]}><TeamPanel /></ProtectedRoute>} />
        <Route path="/teams/:id/players" element={<ProtectedRoute allowedRoles={["ADMIN"]}><TeamPlayers /></ProtectedRoute>} />
        <Route path="/players/form" element={<ProtectedRoute allowedRoles={["ADMIN"]}><PlayerForm /></ProtectedRoute>} />
        <Route path="/my-team" element={<ProtectedRoute allowedRoles={["JUGADOR"]}><MyTeamPanel /></ProtectedRoute>} />
        <Route path="/my-team/create-player" element={<ProtectedRoute allowedRoles={["JUGADOR"]}><PlayerFormRepresentante /></ProtectedRoute>} />
        <Route path="/regulations/admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><RegulationAdminPanel /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute allowedRoles={["MESA", "ADMIN"]}><MatchesPublic /></ProtectedRoute>} />
        <Route path="/resultados" element={<ResultsPublic />} />
        <Route path="/estadisticas/global" element={<GlobalStats />} />
        <Route path="/estadisticas/jugadores" element={<PlayerStatsPanel />} />
        <Route path="/matches/create" element={<ProtectedRoute allowedRoles={["ADMIN"]}><MatchFormCreate /></ProtectedRoute>} />
        <Route path="/my-matches" element={<ProtectedRoute allowedRoles={["JUGADOR", "ADMIN"]}><MyMatches /></ProtectedRoute>} />
        <Route path="/my-matches/:id/report" element={<ProtectedRoute allowedRoles={["JUGADOR"]}><MatchReportForm /></ProtectedRoute>} />
        <Route path="/my-matches/:id/events" element={<ProtectedRoute allowedRoles={["MESA", "ADMIN"]}><MatchEvents /></ProtectedRoute>} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/reportes" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ReportesPanel /></ProtectedRoute>} />
        <Route path="/admin/validacion" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ValidationPanel /></ProtectedRoute>} />
        <Route path="/admin/historial-validacion" element={<ProtectedRoute allowedRoles={["ADMIN"]}><HistoryPanel /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AuditLogsPanel /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/campeonato" />} />
      </Routes>
    </Router>
  );
}
