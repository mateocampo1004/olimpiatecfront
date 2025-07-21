import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getMatchEvents,
  createMatchEvent,
  updateMatchEvent,
  deleteMatchEvent,
  MatchEventResponseDTO
} from "../api/matchEvents";
import { getPlayersByTeam } from "../api/players";
import { getMatchById, finishMatch, recalculateMatchScore } from "../api/matches";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import ConfirmDialog from "../components/ConfirmDialog"; // ← Importar el dialog

interface Player {
  id: number;
  name: string;
  teamName: string;
}

interface TokenPayload {
  sub: string;
  role: string;
}

export default function MatchEvents() {
  const { id } = useParams();
  const matchId = parseInt(id!);
  const token = localStorage.getItem("token")!;
  const role = token ? jwtDecode<TokenPayload>(token).role : null;
  const navigate = useNavigate();
  const [events, setEvents] = useState<MatchEventResponseDTO[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [matchStatus, setMatchStatus] = useState<string>("PENDING");
  const [validated, setValidated] = useState<boolean>(false);
  const [form, setForm] = useState({
    playerId: 0,
    minute: 0,
    type: "GOL",
    detail: ""
  });

  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({
    playerId: 0,
    minute: 0,
    type: "GOL",
    detail: ""
  });

  // Estado para ConfirmDialog
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; eventId?: number }>({ isOpen: false });

  const loadData = async () => {
    const [match, eventData] = await Promise.all([
      getMatchById(matchId, token),
      getMatchEvents(matchId, token)
    ]);

    setEvents(eventData);
    setHomeTeamName(match.homeTeamName);
    setAwayTeamName(match.awayTeamName);
    setMatchStatus(match.status);
    setValidated(match.validated);

    const [home, away] = await Promise.all([
      getPlayersByTeam(match.homeTeamId, token),
      getPlayersByTeam(match.awayTeamId, token)
    ]);

    const playersWithTeam: Player[] = [
      ...home.map((p: any) => ({ ...p, teamName: match.homeTeamName })),
      ...away.map((p: any) => ({ ...p, teamName: match.awayTeamName }))
    ];

    setPlayers(playersWithTeam);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async () => {
    await createMatchEvent(
      {
        matchId,
        playerId: form.playerId,
        minute: form.minute,
        type: form.type,
        detail: form.detail
      },
      token
    );
    toast.success("Evento registrado correctamente");
    await recalculateMatchScore(matchId, token);
    setForm({ playerId: 0, minute: 0, type: "GOL", detail: "" });
    loadData();
  };

  const handleFinishMatch = async () => {
    await finishMatch(matchId, token);
    toast.success("Partido finalizado");
    setMatchStatus("COMPLETED");
    navigate("/resultados");
    loadData();
  };

  const handleEditEvent = (e: MatchEventResponseDTO) => {
    setEditingEventId(e.id);
    setEditForm({
      playerId: players.find(p => p.name === e.playerName)?.id ?? 0,
      minute: e.minute,
      type: e.type,
      detail: e.detail || ""
    });
  };

  const handleSaveEdit = async () => {
    await updateMatchEvent(
      editingEventId!,
      {
        matchId,
        playerId: editForm.playerId,
        minute: editForm.minute,
        type: editForm.type,
        detail: editForm.detail
      },
      token
    );
    setEditingEventId(null);
    toast.success("Evento editado correctamente");
    await recalculateMatchScore(matchId, token);
    loadData();
  };

  // Usar ConfirmDialog para borrar
  const handleDeleteEvent = (eventId: number) => {
    setConfirmDialog({ isOpen: true, eventId });
  };

  const confirmDeleteEvent = async () => {
    if (!confirmDialog.eventId) return;
    await deleteMatchEvent(confirmDialog.eventId, token);
    toast.success("Evento eliminado");
    await recalculateMatchScore(matchId, token);
    setConfirmDialog({ isOpen: false });
    loadData();
  };

  const canEditOrDelete = () => role === "ADMIN" || (role === "MESA" && matchStatus === "PENDING");

  const allowForm = matchStatus === "PENDING" || (matchStatus === "COMPLETED" && !validated);

  const countEvents = (team: string, type: string, detail?: string) => {
    return events.filter(
      e => e.teamName === team && e.type === type && (!detail || e.detail?.toUpperCase() === detail.toUpperCase())
    ).length;
  };

  const renderIcon = (e: MatchEventResponseDTO) => {
    if (e.type === "GOL") return "⚽";
    if (e.type === "TARJETA") return e.detail === "ROJA" ? "🟥" : "🟨";
    return "";
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-center text-white mb-6">Eventos del Partido #{matchId}</h2>

      {allowForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {[homeTeamName, awayTeamName].map((teamName, idx) => (
            <div key={idx} className="p-4 border rounded shadow">
              <h3 className="text-white font-semibold mb-3 text-center text-blue-700">
                Registrar Evento - {teamName}
              </h3>
              <div className="flex flex-col gap-3">
                <select className="border rounded px-3 py-2" value={form.playerId} onChange={e => setForm({ ...form, playerId: parseInt(e.target.value) })}>
                  <option value={0}>-- Selecciona jugador --</option>
                  {players.filter(p => p.teamName === teamName).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <input className="border rounded px-3 py-2" type="number" value={form.minute} min={0} placeholder="Minuto"
                  onChange={e => setForm({ ...form, minute: parseInt(e.target.value) })} />

                <select className="border rounded px-3 py-2" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="GOL">Gol</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>

                {form.type === "TARJETA" && (
                  <select className="border rounded px-3 py-2" value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })}>
                    <option value="">-- Tipo tarjeta --</option>
                    <option value="AMARILLA">Amarilla</option>
                    <option value="ROJA">Roja</option>
                  </select>
                )}

                <button onClick={handleSubmit} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Guardar Evento
                </button>
                <button onClick={handleSubmit} className="btn-primary mt-2">
                  💾 Guardar Evento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {allowForm && (
        <div className="text-center mb-8">
          <button onClick={handleFinishMatch} className="btn-tertiary">
            🏁 Finalizar Partido
          </button>
        </div>
      )}

      <section>
        <h3 className="text-white font-semibold mb-3">Eventos Registrados</h3>
        <div className="grid text-white grid-cols-2 gap-6">
          {[homeTeamName, awayTeamName].map((teamName, idx) => (
            <div key={idx}>
              <h4 className={`font-bold mb-2 ${idx === 0 ? "text-blue-700" : "text-red-700"}`}>{teamName}</h4>
              <div className="mb-2 text-sm">
                ⚽ {countEvents(teamName, "GOL")} &nbsp;&nbsp;
                🟨 {countEvents(teamName, "TARJETA", "AMARILLA")} &nbsp;&nbsp;
                🟥 {countEvents(teamName, "TARJETA", "ROJA")}
              </div>
              <ul className="list-disc list-inside text-white">
                {events.filter(e => e.teamName === teamName).map(e =>
                  editingEventId === e.id ? (
                    <li key={e.id}>
                      <select className="border rounded px-2 py-1 mr-1" value={editForm.playerId} onChange={ev => setEditForm({ ...editForm, playerId: parseInt(ev.target.value) })}>
                        <option value={0}>-- Jugador --</option>
                        {players.filter(p => p.teamName === teamName).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input className="border rounded px-2 py-1 mr-1" type="number" min={0} value={editForm.minute}
                        onChange={ev => setEditForm({ ...editForm, minute: parseInt(ev.target.value) })} style={{ width: 50 }} />
                      <select className="border rounded px-2 py-1 mr-1" value={editForm.type} onChange={ev => setEditForm({ ...editForm, type: ev.target.value })}>
                        <option value="GOL">Gol</option>
                        <option value="TARJETA">Tarjeta</option>
                      </select>
                      {editForm.type === "TARJETA" && (
                        <select className="border rounded px-2 py-1 mr-1" value={editForm.detail} onChange={ev => setEditForm({ ...editForm, detail: ev.target.value })}>
                          <option value="">-- Tipo tarjeta --</option>
                          <option value="AMARILLA">Amarilla</option>
                          <option value="ROJA">Roja</option>
                        </select>
                      )}
                      <button className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded mr-1" onClick={handleSaveEdit}>Guardar</button>
                      <button className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded" onClick={() => setEditingEventId(null)}>Cancelar</button>
                    </li>
                  ) : (
                    <li key={e.id}>
                      {renderIcon(e)} {e.minute}' - {e.type} {e.detail && `(${e.detail})`} - {e.playerName}
                      {canEditOrDelete() && (
                        <div className="flex gap-2">
  <button className="btn-primary btn-sm" onClick={() => handleEditEvent(e)}>
    Editar
  </button>
  <button className="btn-secondary btn-sm" onClick={() => handleDeleteEvent(e.id)}>
    Eliminar
  </button>
</div>

                      )}
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={confirmDeleteEvent}
        title="¿Eliminar evento?"
        message="¿Seguro que deseas eliminar este evento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        icon="🗑️"
      />
    </div>
  );
}
