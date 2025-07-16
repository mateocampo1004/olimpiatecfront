import { useEffect, useState } from "react";
import { createPlayer, getPlayers } from "../api/players";
import { getTeams } from "../api/teams";
import { Player } from "../types/player";
import { Team } from "../types/team";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

export default function PlayerForm() {
  const token = localStorage.getItem("token")!;
  const navigate = useNavigate();

  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [modalMessage, setModalMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    cedula: "",
    dorsal: "",
    carrera: "",
    teamId: 0
  });
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const loadPlayers = async () => {
      const data = await getPlayers(token);
      const sorted = data.sort((a: Player, b: Player) =>
        a.name.localeCompare(b.name)
      );
      setPlayers(sorted);
    };

    const loadTeams = async () => {
      const data = await getTeams(token);
      setTeams(data);
    };

    loadPlayers();
    loadTeams();
  }, [token]);

  const handleDorsalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setForm({ ...form, dorsal: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dorsalNum = Number(form.dorsal);

    if (!form.name || !form.cedula || !form.carrera || form.dorsal.trim() === "" || form.teamId === 0) {
      setModalMessage("Todos los campos son obligatorios");
      return;
    }

    if (!/^\d{10}$/.test(form.cedula)) {
      setModalMessage("La cédula debe tener exactamente 10 dígitos numéricos");
      return;
    }

    if (isNaN(dorsalNum) || dorsalNum <= 0) {
      setModalMessage("El dorsal debe ser un número mayor a 0");
      return;
    }

    const duplicateCedula = players.find(
      (p) => p.cedula === form.cedula && p.team?.id === form.teamId
    );
    if (duplicateCedula) {
      setModalMessage("Ya existe un jugador con esa cédula en ese equipo");
      return;
    }

    const duplicateDorsal = players.find(
      (p) => p.dorsal === dorsalNum && p.team?.id === form.teamId
    );
    if (duplicateDorsal) {
      setModalMessage("Ya existe un jugador con ese dorsal en ese equipo");
      return;
    }

    try {
      await createPlayer({ ...form, dorsal: dorsalNum }, token);
      setModalMessage("Jugador registrado correctamente");
      setForm({ name: "", cedula: "", dorsal: "", carrera: "", teamId: 0 });

      const data = await getPlayers(token);
      const sorted = data.sort((a: Player, b: Player) =>
        a.name.localeCompare(b.name)
      );
      setPlayers(sorted);

      setTimeout(() => {
        setOpenModal(false);
        setModalMessage("");
      }, 1200);
    } catch {
      setModalMessage("Error al registrar jugador");
    }
  };

  return (
    <main className="container">
      {/* Botón Volver rediseñado como en la imagen */}
      <button
        onClick={() => navigate("/panel")}
        style={{
          backgroundColor: "#f3f4f6",
          borderRadius: "12px",
          padding: "8px 12px",
          border: "none",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          marginBottom: "20px"
        }}
      >
        <span style={{ fontSize: "18px", color: "#374151" }}>←</span>
      </button>

      <h2 style={{ color: "#2563eb", fontWeight: "bold", marginBottom: 20 }}>
        Gestión de jugadores
      </h2>

      <button
        className="btn-primary"
        onClick={() => setOpenModal(true)}
        style={{ marginBottom: 28 }}
      >
        Registrar jugador
      </button>

      <Modal
        isOpen={openModal}
        onClose={() => { setOpenModal(false); setModalMessage(""); }}
        title="Registrar jugador"
        size="sm"
      >
        {modalMessage && (
          <div
            style={{
              padding: "10px 14px",
              marginBottom: "12px",
              background: modalMessage.includes("Error") ? "#fee2e2" :
                modalMessage.includes("registrado") ? "#d1fae5" : "#fffbe5",
              color: modalMessage.includes("Error") ? "#991b1b" :
                modalMessage.includes("registrado") ? "#065f46" : "#924400",
              borderRadius: "10px",
              border: `1px solid ${modalMessage.includes("Error") ? "#fca5a5" : "#a7f3d0"}`
            }}
          >
            {modalMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, maxWidth: 350 }}>
          <input
            type="text"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Cédula"
            maxLength={10}
            value={form.cedula}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,10}$/.test(value)) {
                setForm({ ...form, cedula: value });
              }
            }}
          />
          <input
            type="text"
            placeholder="Dorsal"
            value={form.dorsal}
            onChange={handleDorsalInput}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
          />
          <input
            type="text"
            placeholder="Carrera"
            value={form.carrera}
            onChange={(e) => setForm({ ...form, carrera: e.target.value })}
          />
          <select
            value={form.teamId}
            onChange={(e) => setForm({ ...form, teamId: Number(e.target.value) })}
          >
            <option value={0}>Selecciona un equipo</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 12, marginTop: 8, justifyContent: "center" }}>
            <button className="btn-primary" type="submit">
              Guardar
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setOpenModal(false); setModalMessage(""); }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      <hr style={{ margin: "32px 0" }} />

      <h3 style={{ marginBottom: 16, color: "#374151", fontWeight: 600 }}>
        Lista de jugadores registrados
      </h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Dorsal</th>
            <th>Carrera</th>
            <th>Equipo</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, index) => (
            <tr key={p.id}>
              <td>{index + 1}</td>
              <td>{p.name}</td>
              <td>{p.cedula}</td>
              <td>{p.dorsal}</td>
              <td>{p.carrera}</td>
              <td>{p.team?.name || "Sin equipo"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
