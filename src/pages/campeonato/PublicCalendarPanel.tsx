import { useEffect, useState } from "react";
import { getMatches, MatchDTO } from "../../api/matches";

export default function PublicCalendarPanel() {
  const [matches, setMatches] = useState<MatchDTO[]>([]);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const data = await getMatches();
    // ✅ Filtramos solo los partidos pendientes
    const pendingMatches = data.filter((match: MatchDTO) => match.status === "PENDING");
    setMatches(pendingMatches);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Calendario de Partidos</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-700 text-white">
          <thead className="bg-[#1f3a45] text-lg">
            <tr>
              <th className="p-3 border border-gray-700 text-center">Fecha</th>
              <th className="p-3 border border-gray-700 text-center">Hora</th>
              <th className="p-3 border border-gray-700 text-center">Local</th>
              <th className="p-3 border border-gray-700 text-center">Visitante</th>
              <th className="p-3 border border-gray-700 text-center">Lugar</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <tr key={match.id} className="hover:bg-[#2c4d5b] text-center">
                <td className="p-3 border border-gray-700">{match.date}</td>
                <td className="p-3 border border-gray-700">{match.startTime.slice(0,5)} - {match.endTime.slice(0,5)}</td>
                <td className="p-3 border border-gray-700">{match.homeTeamName}</td>
                <td className="p-3 border border-gray-700">{match.awayTeamName}</td>
                <td className="p-3 border border-gray-700">{match.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {matches.length === 0 && (
        <p className="text-center text-gray-400 mt-10">No hay partidos pendientes por jugar.</p>
      )}
    </div>
  );
}
