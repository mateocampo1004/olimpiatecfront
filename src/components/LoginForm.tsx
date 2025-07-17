import { useState } from "react";
import { login } from "../api/auth";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

interface TokenPayload {
  sub: string;
  role: string;
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await login(email, password);
      localStorage.setItem("token", token);

      const payload: TokenPayload = jwtDecode(token);

      if (payload.role === "ADMIN") {
        window.location.href = "/panel";
      } else if (payload.role === "JUGADOR") {
        window.location.href = "/my-team";
      } else if (payload.role === "MESA") {
        window.location.href = "/matches";
      } else {
        window.location.href = "/unauthorized";
      }
    } catch {
      setError("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="soccer-icon">⚽</div>
          <h1>OLIMPIATEC</h1>
          <p>Sistema de Gestión de Campeonato</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
              <span className="input-icon">📧</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                tabIndex={-1}
              >
                <span className="emoji" style={{ position: "relative", top: "-2px" }}>
                  {showPassword ? "🔒" : "🔓"}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>

          <button
            type="button"
            className="btn-link forgot-password"
            onClick={handleForgotPassword}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        <div className="login-footer">
          <p>© 2025 OLIMPIATEC - Todos los derechos reservados</p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a, #1e293b);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .login-card {
          background: #ffffffee;
          border-radius: 20px;
          padding: 40px 32px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 25px 40px rgba(0, 0, 0, 0.2);
          position: relative;
          animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .soccer-icon {
          font-size: 56px;
          margin-bottom: 12px;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .login-header h1 {
          font-size: 28px;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0;
        }

        .login-header p {
          color: #64748b;
          font-size: 14px;
          margin-top: 4px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group label {
          font-weight: 600;
          font-size: 14px;
          color: #334155;
          margin-bottom: 4px;
        }

        .input-wrapper {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          border: 1.5px solid #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
          font-size: 15px;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          background: white;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: #94a3b8;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 18px;
        }

        .error-message {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .login-btn {
          background: #2563eb;
          color: white;
          padding: 14px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: background 0.3s ease, transform 0.2s;
        }

        .login-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .login-btn:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .forgot-password {
          margin-top: 12px;
          text-align: center;
          color: #3b82f6;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }

        .forgot-password:hover {
          text-decoration: underline;
        }

        .login-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }

        @media (max-width: 640px) {
          .login-card {
            padding: 28px 20px;
          }
        }
      `}</style>
    </div>
  );
}
