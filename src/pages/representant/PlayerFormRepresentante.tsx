import { useEffect, useState } from "react";
import { createPlayer, getPlayersByTeam } from "../../api/players";
import { getTeamOfRepresentative } from "../../api/teams";
import { useNavigate } from "react-router-dom";
import { Player } from "../../types/player";
import Modal from "../../components/Modal";

export default function PlayerFormRepresentante() {
  const token = localStorage.getItem("token")!;
  const navigate = useNavigate();

  const [team, setTeam] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    cedula: "",
    dorsal: "",
    carrera: "",
  });
  const [openModal, setOpenModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const loadTeamAndPlayers = async () => {
      try {
        const t = await getTeamOfRepresentative(token);
        setTeam(t);
        const playersOfTeam = await getPlayersByTeam(t.id, token);
        setPlayers(playersOfTeam);
      } catch (e) {
        setMessage("No tienes equipo asignado o hubo un error.");
      }
    };
    loadTeamAndPlayers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dorsalNum = Number(form.dorsal);

    if (!form.name || !form.cedula || !form.carrera || form.dorsal.trim() === "") {
      setModalMessage("Todos los campos son obligatorios");
      return;
    }
    if (isNaN(dorsalNum) || dorsalNum <= 0) {
      setModalMessage("El dorsal debe ser un número mayor a 0");
      return;
    }
    const duplicateCedula = players.find((p) => p.cedula === form.cedula);
    if (duplicateCedula) {
      setModalMessage("Ya existe un jugador con esa cédula en tu equipo");
      return;
    }
    const duplicateDorsal = players.find((p) => p.dorsal === dorsalNum);
    if (duplicateDorsal) {
      setModalMessage("Ya existe un jugador con ese dorsal en tu equipo");
      return;
    }

    try {
      await createPlayer({ ...form, dorsal: dorsalNum, teamId: team.id }, token);
      setModalMessage("Jugador registrado correctamente");
      setForm({ name: "", cedula: "", dorsal: "", carrera: "" });
      const updatedPlayers = await getPlayersByTeam(team.id, token);
      setPlayers(updatedPlayers);

      setTimeout(() => {
        setOpenModal(false);
        setModalMessage("");
      }, 1200);
    } catch {
      setModalMessage("Error al registrar jugador");
    }
  };

  const handleDorsalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setForm({ ...form, dorsal: value });
    }
  };

  if (!team && !message) return <main className="container"><p>Cargando tu equipo...</p></main>;
  if (!team && message) return <main className="container"><p>{message}</p></main>;

  return (
    <main className="container">
      <h2>Agregar jugador a: {team.name}</h2>
      <button className="btn-back" onClick={() => navigate("/my-team")}>
        Volver
      </button>
      <button className="btn-primary" onClick={() => setOpenModal(true)} style={{ margin: "16px 0 24px 0" }}>
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
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
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

      <hr />
      <h3>Jugadores registrados en tu equipo</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Dorsal</th>
            <th>Carrera</th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <td colSpan={5}>No hay jugadores registrados.</td>
            </tr>
          ) : (
            players.map((p, index) => (
              <tr key={p.id}>
                <td>{index + 1}</td>
                <td>{p.name}</td>
                <td>{p.cedula}</td>
                <td>{p.dorsal}</td>
                <td>{p.carrera}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
