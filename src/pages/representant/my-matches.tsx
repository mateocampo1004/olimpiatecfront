import { useEffect, useState } from "react";
import { getMatches, MatchDTO } from "../../api/matches";
import { getTeamOfRepresentative } from "../../api/teams";
import { useNavigate } from "react-router-dom";
import { getMyReportForMatch } from "../../api/matchreport";
import StatusBadge from "../../components/StatusBadge";
import DataTable from "../../components/DataTable";

// Etiquetas legibles
const ESTADO_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  COMPLETED: "Jugado",
  CANCELLED: "Cancelado",
};

export default function MyMatches() {
  const [team, setTeam] = useState<{ id: number; name: string } | null>(null);
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<{ [matchId: number]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const token = localStorage.getItem("token") || "";
  const navigate = useNavigate();

  // Traer datos y filtrar solo mis partidos
  useEffect(() => {
    async function fetchData() {
      try {
        const myTeam = await getTeamOfRepresentative(token);
        setTeam(myTeam);

        const allMatches = await getMatches();
        const myMatches = allMatches.filter(
          (m) => m.homeTeamName === myTeam.name || m.awayTeamName === myTeam.name
        );

        // Más recientes primero
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

  // Saber si ya hay reporte para cada partido
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

  // Filtro y búsqueda
  const filteredMatches = matches.filter((match) => {
    const normalized = (s: string) => (s || "").toLowerCase();
    const statusMatch =
      !statusFilter || match.status === statusFilter;
    const search =
      normalized(match.date).includes(normalized(searchTerm)) ||
      normalized(match.startTime).includes(normalized(searchTerm)) ||
      normalized(match.homeTeamName).includes(normalized(searchTerm)) ||
      normalized(match.awayTeamName).includes(normalized(searchTerm)) ||
      normalized(match.location).includes(normalized(searchTerm)) ||
      normalized(ESTADO_LABELS[match.status] || "").includes(normalized(searchTerm));
    return statusMatch && (!searchTerm || search);
  });

  // Columnas para DataTable
  const columns = [
    {
      key: "date",
      label: "Fecha",
      sortable: true,
    },
    {
      key: "startTime",
      label: "Hora",
      sortable: true,
      render: (_: string, row: MatchDTO) => (
        <>
          {row.startTime.slice(0, 5)} - {row.endTime.slice(0, 5)}
        </>
      ),
    },
    {
      key: "homeTeamName",
      label: "Local",
      sortable: true,
    },
    {
      key: "awayTeamName",
      label: "Visitante",
      sortable: true,
    },
    {
      key: "location",
      label: "Lugar",
      sortable: true,
    },
    {
      key: "status",
      label: "Estado",
      sortable: true,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_: any, match: MatchDTO) =>
        match.status !== "COMPLETED" ? (
          reports[match.id] ? (
            <button
              className="btn-tertiary btn-sm"
              onClick={() => navigate(`/my-matches/${match.id}/report`)}
            >
              ✏️ Editar Alineación
            </button>
          ) : (
            <button
              className="btn-primary btn-sm"
              onClick={() => navigate(`/my-matches/${match.id}/report`)}
            >
              📝 Registrar Alineación
            </button>
          )
        ) : null,
      align: "center" as const,
    },
  ];

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "40px auto 0 auto",
        padding: "0 20px",
      }}
    >
      <div
        className="text-3xl font-bold mb-8 text-white text-center drop-shadow"
        style={{ textShadow: "0 2px 10px #1e40af33" }}
      >
        Mis Partidos
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full md:w-80"
          placeholder="Por equipo, lugar, fecha, estado..."
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full md:w-60"
        >
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="COMPLETED">Jugado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      <button
  className="btn-primary btn-sm"
  style={{ minWidth: 130 }}
  onClick={() => {
    setSearchTerm("");
    setStatusFilter("");
  }}
  type="button"
>
  Limpiar filtros
</button>

      </div>

      {/* Tabla bonita tipo panel */}
      <DataTable
        data={filteredMatches}
        columns={columns}
        loading={loading}
        emptyMessage="No se encontraron partidos"
        hoverable
        striped
      />
      {error && (
        <div className="text-center text-red-600 mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
