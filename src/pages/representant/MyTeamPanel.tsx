import { useEffect, useState } from "react";
import { getTeamOfRepresentative } from "../../api/teams";
import { getPlayersByTeam, updatePlayer, deletePlayer } from "../../api/players";
import { Player } from "../../types/player";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function MyTeamPanel() {
  const [team, setTeam] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", cedula: "", dorsal: "", carrera: "" });
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; playerId?: number }>({ isOpen: false });
  const token = localStorage.getItem("token")!;
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const teamData = await getTeamOfRepresentative(token);
        setTeam(teamData);
        const playersData = await getPlayersByTeam(teamData.id, token);
        setPlayers(playersData);
      } catch (err) {
        setMessage("Error al cargar tu equipo. Es posible que no tengas uno asignado.");
      }
    };
    loadData();
  }, [token]);

  const handleEdit = (player: Player) => {
    setEditId(player.id);
    setEditForm({
      name: player.name,
      cedula: player.cedula,
      dorsal: String(player.dorsal),
      carrera: player.carrera,
    });
  };

  const handleUpdate = async (id: number) => {
    if (
      !editForm.name ||
      !editForm.cedula ||
      !editForm.carrera ||
      editForm.dorsal.trim() === ""
    ) {
      setMessage("Todos los campos son obligatorios");
      return;
    }

    const dorsalNum = Number(editForm.dorsal);
    if (isNaN(dorsalNum) || dorsalNum <= 0) {
      setMessage("El dorsal debe ser un número mayor a 0");
      return;
    }

    const duplicateDorsal = players.some(
      (p) => p.dorsal === dorsalNum && p.id !== id
    );

    if (duplicateDorsal) {
      setMessage("Ya existe un jugador con ese dorsal en tu equipo.");
      return;
    }

    try {
      await updatePlayer(id, { ...editForm, dorsal: dorsalNum, teamId: team.id }, token);
      const updatedPlayers = await getPlayersByTeam(team.id, token);
      setPlayers(updatedPlayers);
      setEditId(null);
      setEditForm({ name: "", cedula: "", dorsal: "", carrera: "" });
      setMessage("Jugador actualizado correctamente.");
    } catch (err: any) {
      setMessage("Error al actualizar jugador: " + err.response?.data?.message || err.message);
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({ isOpen: true, playerId: id });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.playerId) return;
    try {
      await deletePlayer(confirmDialog.playerId, token);
      const updatedPlayers = await getPlayersByTeam(team.id, token);
      setPlayers(updatedPlayers);
      setMessage("Jugador eliminado correctamente.");
    } catch (err: any) {
      setMessage("Error al eliminar jugador: " + err.response?.data?.message || err.message);
    } finally {
      setConfirmDialog({ isOpen: false });
    }
  };

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.cedula.includes(search) ||
    p.dorsal.toString().includes(search)
  );

  if (!team) return <p>{message || "Cargando equipo..."}</p>;

  const handleDorsalInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setEditForm({ ...editForm, dorsal: value });
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <button className="btn-back" onClick={() => navigate("/")}>
        Volver
      </button>
      
<h2 style={{ color: "#fff" }}>Mi equipo: {team.name}</h2>
      {message && <p style={{ color: "red" }}>{message}</p>}

      {/* Campo de búsqueda */}
      <input
        type="text"
        placeholder="Buscar por nombre, cédula o dorsal"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
      />

<h3 style={{ color: "#fff" }}>Jugadores registrados</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Dorsal</th>
            <th>Carrera</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredPlayers.map((p, index) => (
            <tr key={p.id}>
              <td>{index + 1}</td>
              {editId === p.id ? (
                <>
                  <td>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.cedula}
                      onChange={(e) => setEditForm({ ...editForm, cedula: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editForm.dorsal}
                      onChange={handleDorsalInput}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                    />
                  </td>
                  <td>
                    <input
                      value={editForm.carrera}
                      onChange={(e) => setEditForm({ ...editForm, carrera: e.target.value })}
                    />
                  </td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-tertiary btn-sm" onClick={() => handleUpdate(p.id)}>Guardar</button>
                    <button className="btn-neutral btn-sm" onClick={() => setEditId(null)}>Cancelar</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{p.name}</td>
                  <td>{p.cedula}</td>
                  <td>{p.dorsal}</td>
                  <td>{p.carrera}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary btn-sm" onClick={() => handleEdit(p)}>Editar</button>
                    <button className="btn-secondary btn-sm" onClick={() => handleDelete(p.id)}>Eliminar</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar jugador?"
        message="¿Seguro que deseas eliminar este jugador? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        icon="🗑️"
      />
    </div>
  );
}
