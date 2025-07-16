import { useEffect, useState } from "react";
import { getMatches, MatchDTO } from "../../api/matches";
import { getTeamOfRepresentative } from "../../api/teams";
import { useNavigate } from "react-router-dom";
import { getMyReportForMatch } from "../../api/matchreport";

export default function MyMatches() {
  const [team, setTeam] = useState<{ id: number; name: string } | null>(null);
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<{ [matchId: number]: boolean }>({});
  const token = localStorage.getItem("token") || "";
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Obtener equipo del representante
        const myTeam = await getTeamOfRepresentative(token);
        setTeam(myTeam);

        // 2. Obtener todos los partidos
        const allMatches = await getMatches();

        // 3. Filtrar solo los partidos de este equipo (local o visitante)
        const myMatches = allMatches.filter(
          (m) => m.homeTeamName === myTeam.name || m.awayTeamName === myTeam.name
        );

        // Ordenar por fecha descendente (más reciente primero)
        myMatches.sort((a, b) => b.date.localeCompare(a.date));

        setMatches(myMatches);
      } catch (e: any) {
        setError("Error cargando partidos.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  // Consultar estado de reporte para cada partido
  useEffect(() => {
    async function fetchReports() {
      const reportStates: { [matchId: number]: boolean } = {};
      for (const match of matches) {
        try {
          await getMyReportForMatch(match.id, token);
          reportStates[match.id] = true;
        } catch {
          reportStates[match.id] = false;
        }
      }
      setReports(reportStates);
    }
    if (matches.length) {
      fetchReports();
    }
  }, [matches, token]);

  if (loading) return <div className="text-center mt-6">Cargando partidos...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto my-8 p-4 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-white">Mis Partidos</h2>
      {!matches.length ? (
        <div className="text-gray-600 text-center py-8">No tienes partidos programados aún.</div>
      ) : (
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Hora</th>
              <th className="px-4 py-2">Local</th>
              <th className="px-4 py-2">Visitante</th>
              <th className="px-4 py-2">Lugar</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2">{match.date}</td>
                <td className="px-4 py-2">
                  {match.startTime.slice(0, 5)} - {match.endTime.slice(0, 5)}
                </td>
                <td className="px-4 py-2">{match.homeTeamName}</td>
                <td className="px-4 py-2">{match.awayTeamName}</td>
                <td className="px-4 py-2">{match.location}</td>
                <td className="px-4 py-2">
                  {match.status === "PENDING" ? (
                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                      Pendiente
                    </span>
                  ) : match.status === "COMPLETED" ? (
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                      Jugado
                    </span>
                  ) : (
                    <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                      Cancelado
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {/* Solo mostrar botón si NO está jugado */}
                  {match.status !== "COMPLETED" ? (
                    reports[match.id] ? (
                      <button
                        className="btn-tertiary btn-sm"
                        onClick={() => navigate(`/my-matches/${match.id}/report`)}
                      >
                        ✏️ Editar Alineacion
                      </button>
                    ) : (
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => navigate(`/my-matches/${match.id}/report`)}
                      >
                        📝 Registrar Alineacion
                      </button>
                    )
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
