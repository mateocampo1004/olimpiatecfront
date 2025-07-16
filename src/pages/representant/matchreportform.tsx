import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlayersByTeam } from "../../api/players";
import { getTeamOfRepresentative } from "../../api/teams";
import { getMatches, MatchDTO } from "../../api/matches";
import {
  registerMatchReport,
  getMyReportForMatch,
} from "../../api/matchreport";

export default function MatchReportForm() {
  const token = localStorage.getItem("token") || "";
  const { id } = useParams();
  const matchId = Number(id);
  const navigate = useNavigate();

  const [team, setTeam] = useState<{ id: number; name: string } | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [match, setMatch] = useState<MatchDTO | null>(null);
  const [lineup, setLineup] = useState<number[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const myTeam = await getTeamOfRepresentative(token);
        setTeam(myTeam);

        const allMatches = await getMatches();
        const thisMatch = allMatches.find((m) => m.id === matchId);
        setMatch(thisMatch || null);

        const teamPlayers = await getPlayersByTeam(myTeam.id, token);
        setPlayers(teamPlayers);

        // Cargar reporte ya existente
        try {
          const report = await getMyReportForMatch(matchId, token);
          setLineup(report.lineup || []);
          setCaptainId(report.captainId || null);
        } catch {
          setLineup([]);
          setCaptainId(null);
        }
      } catch {
        setMessage("Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, matchId]);

  // Checkbox change logic
  const handleLineupChange = (playerId: number) => {
    setLineup((prev) => {
      if (prev.includes(playerId)) {
        // Si el capitán es deseleccionado, se borra
        if (captainId === playerId) setCaptainId(null);
        return prev.filter((id) => id !== playerId);
      } else if (prev.length < 7) {
        return [...prev, playerId];
      }
      return prev;
    });
  };

  // Los suplentes son todos los que no están en lineup
  const titulares = players.filter((p) => lineup.includes(p.id));
  const suplentes = players.filter((p) => !lineup.includes(p.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    if (lineup.length < 4 || lineup.length > 7) {
      setMessage("La alineación debe tener mínimo 4 y máximo 7 jugadores.");
      return;
    }
    if (!captainId || !lineup.includes(captainId)) {
      setMessage("El capitán debe ser uno de los titulares seleccionados.");
      return;
    }
    try {
      setLoading(true);
      await registerMatchReport(
        {
          matchId,
          teamId: team.id,
          captainId,
          lineup,
          observations: "", // Ya no se usan observaciones
        },
        token
      );
      setMessage("Reporte registrado con éxito.");
      setTimeout(() => navigate("/my-matches"), 1200);
    } catch (err: any) {
      setMessage(
        err?.response?.data?.error ||
          "Error registrando reporte. Intenta más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-8">Cargando...</div>;

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">
        {match?.homeTeamName} vs {match?.awayTeamName}
      </h2>
      <div className="mb-4 text-gray-700 text-center">
        <b>Fecha:</b> {match?.date}
        <br />
        <b>Hora:</b> {match?.startTime?.slice(0, 5)} - {match?.endTime?.slice(0, 5)}
        <br />
        <b>Lugar:</b> {match?.location}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-semibold mb-2">Selecciona titulares (4-7):</label>
          <ul className="mb-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
            {players.map((p) => (
              <li
                key={p.id}
                className={`flex items-center p-2 rounded cursor-pointer transition border ${
                  lineup.includes(p.id)
                    ? "bg-blue-50 border-blue-500 font-semibold"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-2 accent-blue-600"
                  checked={lineup.includes(p.id)}
                  onChange={() => handleLineupChange(p.id)}
                  disabled={!lineup.includes(p.id) && lineup.length >= 7}
                  id={`player-${p.id}`}
                />
                <label htmlFor={`player-${p.id}`} className="truncate cursor-pointer">
                  {p.name}
                </label>
              </li>
            ))}
          </ul>
          <div className="text-xs text-gray-600 mt-1">
            Seleccionados: <b>{lineup.length}</b> / 7
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Capitán:</label>
          <select
            value={captainId ?? ""}
            onChange={(e) => setCaptainId(Number(e.target.value))}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Selecciona capitán</option>
            {titulares.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 p-2 rounded bg-gray-50">
          <div className="mb-1 font-semibold text-gray-700">Titulares seleccionados:</div>
          {titulares.length === 0 ? (
            <div className="text-gray-400">Ninguno</div>
          ) : (
            <ul className="list-disc list-inside text-blue-900 text-sm">
              {titulares.map((p) => (
                <li key={p.id}>
                  {p.name}
                  {captainId === p.id && (
                    <span className="ml-2 text-xs text-blue-600 font-bold">(Capitán)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 font-semibold text-gray-700">Suplentes:</div>
          {suplentes.length === 0 ? (
            <div className="text-gray-400">Ninguno</div>
          ) : (
            <ul className="list-disc list-inside text-gray-500 text-sm">
              {suplentes.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          💾 Guardar Reporte
        </button>
      </form>
      {message && (
        <div className="mt-4 p-2 rounded bg-gray-100 text-center text-blue-800">
          {message}
        </div>
      )}
    </div>
  );
}
