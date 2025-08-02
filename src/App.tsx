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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    setSidebarOpen(false);
    window.location.href = "/campeonato";
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  return (
    <Router>
      {/* Material Design App Bar */}
      <header className="md-app-bar">
        <div className="md-app-bar-content">
          <button 
            className="md-icon-button md-menu-button"
            onClick={toggleSidebar}
            aria-label="Abrir menú"
          >
            <span className="material-icons">menu</span>
          </button>
          
          <div className="md-app-bar-title">
            <span className="md-title">OLIMPIATEC</span>
            <span className="md-subtitle">Sistema de Gestión</span>
          </div>

          <div className="md-app-bar-actions">
            {role ? (
              <button className="md-button md-button-text" onClick={handleLogout}>
                <span className="material-icons">logout</span>
                <span className="md-button-label">Cerrar sesión</span>
              </button>
            ) : (
              <Link to="/login" className="md-button md-button-contained">
                <span className="material-icons">login</span>
                <span className="md-button-label">Iniciar sesión</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Material Design Navigation Drawer */}
      <div className={`md-nav-drawer-scrim ${sidebarOpen ? 'md-nav-drawer-scrim--open' : ''}`} onClick={closeSidebar}></div>
      
      <nav className={`md-nav-drawer ${sidebarOpen ? 'md-nav-drawer--open' : ''}`}>
        <div className="md-nav-drawer-header">
          <div className="md-nav-drawer-title">
            <span className="material-icons md-nav-drawer-icon">sports_soccer</span>
            <div className="md-nav-drawer-text">
              <h3>OLIMPIATEC</h3>
              <p>Gestión de Campeonato</p>
            </div>
          </div>
        </div>

        <div className="md-nav-drawer-content">
          {/* Sección Pública */}
          <div className="md-nav-section">
            <h4 className="md-nav-section-title">General</h4>
            <Link to="/reglamento" className="md-nav-item" onClick={closeSidebar}>
              <span className="material-icons">description</span>
              <span>Reglamento</span>
            </Link>
            <Link to="/campeonato" className="md-nav-item" onClick={closeSidebar}>
              <span className="material-icons">emoji_events</span>
              <span>Campeonato</span>
            </Link>
          </div>

          {/* ADMIN */}
          {role === "ADMIN" && (
            <div className="md-nav-section">
              <h4 className="md-nav-section-title">Administración</h4>
              <Link to="/panel" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">people</span>
                <span>Gestión Usuarios</span>
              </Link>
              <Link to="/teams" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">groups</span>
                <span>Gestión Equipos</span>
              </Link>
              <Link to="/players/form" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">person_add</span>
                <span>Gestión Jugadores</span>
              </Link>
              <Link to="/regulations/admin" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">rule</span>
                <span>Gestión Reglamento</span>
              </Link>
              <Link to="/matches/create" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">event</span>
                <span>Programar Partido</span>
              </Link>
              <Link to="/reportes" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">assessment</span>
                <span>Generar Reportes</span>
              </Link>
              <Link to="/admin/validacion" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">verified</span>
                <span>Validación</span>
              </Link>
              <Link to="/admin/historial-validacion" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">history</span>
                <span>Historial Validación</span>
              </Link>
              <Link to="/admin/logs" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">bug_report</span>
                <span>Logs de Auditoría</span>
              </Link>
            </div>
          )}

          {/* JUGADOR */}
          {role === "JUGADOR" && (
            <div className="md-nav-section">
              <h4 className="md-nav-section-title">Mi Equipo</h4>
              <Link to="/my-team" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">group</span>
                <span>Mi equipo</span>
              </Link>
              <Link to="/my-team/create-player" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">person_add</span>
                <span>Gestión Jugadores</span>
              </Link>
              <Link to="/my-matches" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">sports</span>
                <span>Mis Partidos</span>
              </Link>
            </div>
          )}

          {/* MESA */}
          {role === "MESA" && (
            <div className="md-nav-section">
              <h4 className="md-nav-section-title">Mesa de Control</h4>
              <Link to="/matches" className="md-nav-item" onClick={closeSidebar}>
                <span className="material-icons">edit</span>
                <span>Registrar Eventos</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className={`md-main-content ${sidebarOpen ? 'md-main-content--shifted' : ''}`}>
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
      </main>
    </Router>
  );
}
