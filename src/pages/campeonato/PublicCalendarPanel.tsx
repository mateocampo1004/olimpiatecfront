import { useEffect, useState } from "react";
import { getMatches, MatchDTO } from "../../api/matches";

export default function PublicCalendarPanel() {
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [dateFilter, setDateFilter] = useState(""); // 👈 para el filtro

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    const data = await getMatches();
    const pendingMatches = data.filter((match: MatchDTO) => match.status === "PENDING");
    setMatches(pendingMatches);
  };

  // Aplica el filtro por fecha
  const filteredMatches = matches.filter(match =>
    !dateFilter || match.date === dateFilter
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Calendario de Partidos</h1>

      {/* Filtro por día */}
      <div className="flex justify-end mb-4">
        <input
          type="date"
          className="border rounded px-3 py-2 text-gray-800"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{ minWidth: 180 }}
        />
        {dateFilter && (
          <button
            className="ml-2 px-3 py-2 bg-gray-300 rounded text-gray-700 hover:bg-gray-400"
            onClick={() => setDateFilter("")}
          >
            Limpiar
          </button>
        )}
      </div>

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
            {filteredMatches.map(match => (
              <tr key={match.id} className="hover:bg-[#2c4d5b] text-center">
                <td className="p-3 border border-gray-700">{match.date}</td>
                <td className="p-3 border border-gray-700">
                  {match.startTime.slice(0, 5)} - {match.endTime.slice(0, 5)}
                </td>
                <td className="p-3 border border-gray-700">{match.homeTeamName}</td>
                <td className="p-3 border border-gray-700">{match.awayTeamName}</td>
                <td className="p-3 border border-gray-700">{match.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMatches.length === 0 && (
        <p className="text-center text-gray-400 mt-10">No hay partidos para ese día.</p>
      )}
    </div>
  );
}
