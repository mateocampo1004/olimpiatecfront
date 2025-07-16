import { useEffect, useState } from "react";
import { getPublicTeams } from "../../api/teams";  // usamos tu api centralizada

interface Team {
  id: number;
  name: string;
  players: Player[];
}

interface Player {
  id: number;
  name: string;
  dorsal: number;
}

export default function TeamsPublicPanel() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const data = await getPublicTeams();
    setTeams(data);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Equipos del Campeonato</h1>

      {teams.map(team => (
        <div key={team.id} className="mb-8 bg-[#162c35] text-white p-4 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">{team.name}</h2>
          <table className="min-w-full border-collapse border border-gray-600 text-lg">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 border border-gray-600">Dorsal</th>
                <th className="p-3 border border-gray-600">Jugador</th>
              </tr>
            </thead>
            <tbody>
              {team.players.map(player => (
                <tr key={player.id} className="text-center hover:bg-[#1f3a45]">
                  <td className="p-3 border border-gray-600">{player.dorsal}</td>
                  <td className="p-3 border border-gray-600">{player.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {teams.length === 0 && (
        <p className="text-center text-gray-400 mt-10">No hay equipos registrados.</p>
      )}
    </div>
  );
}
