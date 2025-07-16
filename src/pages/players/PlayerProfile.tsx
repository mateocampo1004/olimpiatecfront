import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPlayerStats, PlayerStatsDTO } from "../../api/playerStats";

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const [stats, setStats] = useState<PlayerStatsDTO | null>(null);

  useEffect(() => {
    if (playerId) {
      getPlayerStats(parseInt(playerId)).then(setStats);
    }
  }, [playerId]);

  if (!stats) return <div className="text-white text-center mt-20">Cargando estadísticas...</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0a181f]">
      <div className="bg-[#162c35] p-8 rounded-2xl shadow-xl w-full max-w-xl text-white">
        <h1 className="text-3xl font-bold mb-8 text-center border-b border-gray-600 pb-4">
          Perfil del Jugador
        </h1>

        <table className="mx-auto text-lg">
          <tbody>
            <tr className="border-b border-gray-600">
              <td className="p-4 font-semibold">Nombre</td>
              <td className="p-4">{stats.playerName}</td>
            </tr>
            <tr className="border-b border-gray-600">
              <td className="p-4 font-semibold">Equipo</td>
              <td className="p-4">{stats.teamName}</td>
            </tr>
            <tr className="border-b border-gray-600">
              <td className="p-4 font-semibold">Partidos Jugados</td>
              <td className="p-4">{stats.totalMatchesPlayed}</td>
            </tr>
            <tr className="border-b border-gray-600">
              <td className="p-4 font-semibold">Goles</td>
              <td className="p-4">{stats.totalGoals}</td>
            </tr>
            <tr className="border-b border-gray-600">
              <td className="p-4 font-semibold">Tarjetas Amarillas</td>
              <td className="p-4">{stats.yellowCards}</td>
            </tr>
            <tr>
              <td className="p-4 font-semibold">Tarjetas Rojas</td>
              <td className="p-4">{stats.redCards}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
