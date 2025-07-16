import { useState } from "react";
import { useLocation } from "react-router-dom";
import { resetPassword } from "../api/auth";

// Validación y checklist igual que en el panel
function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[\W_]/.test(password),
  };
}

function validatePassword(password: string): string | null {
  const c = passwordChecks(password);
  if (!c.length) return "La contraseña debe tener al menos 8 caracteres.";
  if (!c.upper) return "Debe incluir al menos una letra mayúscula.";
  if (!c.lower) return "Debe incluir al menos una letra minúscula.";
  if (!c.number) return "Debe incluir al menos un número.";
  if (!c.symbol) return "Debe incluir al menos un símbolo o carácter especial.";
  return null;
}

function PasswordChecklist({ password }: { password: string }) {
  const c = passwordChecks(password);
  const checklist = [
    { key: "length", label: "Al menos 8 caracteres" },
    { key: "upper", label: "Una letra mayúscula (A-Z)" },
    { key: "lower", label: "Una letra minúscula (a-z)" },
    { key: "number", label: "Un número (0-9)" },
    { key: "symbol", label: "Un símbolo o caracter especial" },
  ];
  return (
    <ul style={{ marginBottom: 8, marginTop: -8 }}>
      {checklist.map(({ key, label }) => (
        <li key={key} style={{ color: c[key as keyof typeof c] ? "green" : "red", fontSize: 13 }}>
          {c[key as keyof typeof c] ? "✔️" : "❌"} {label}
        </li>
      ))}
    </ul>
  );
}

export default function ResetPasswordForm() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [token] = useState(params.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    try {
      const res = await resetPassword(token, newPassword);
      setMessage(res);
      setNewPassword("");
    } catch (e: any) {
      setError(e.response?.data || "Error al restablecer contraseña.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 350, margin: "auto" }}>
      <h2>Restablecer contraseña</h2>
      <div style={{ position: "relative" }}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          style={{ width: "100%" }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: "#333"
          }}
          tabIndex={-1}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? "🔒" : "🔓"}
        </button>
      </div>
      {newPassword && <PasswordChecklist password={newPassword} />}
      <button type="submit">Cambiar contraseña</button>
      {message && <div style={{ color: "green", marginTop: 10 }}>{message}</div>}
      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
    </form>
  );
}
