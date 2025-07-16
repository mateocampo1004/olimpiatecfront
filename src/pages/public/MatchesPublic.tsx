import { useEffect, useState } from "react";
import { getMatches, MatchDTO } from "../../api/matches";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { jwtDecode } from "jwt-decode";
import "../styles/MatchesPublic.css";

const locales = { es };

const localizer = dateFnsLocalizer({
  format: (date: Date, _formatStr: string, _culture?: string) =>
    format(date, _formatStr, { locale: es }),
  parse: (value: string, _formatStr: string) => parse(value, _formatStr, new Date(), { locale: es }),
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: es }),
  getDay,
  locales,
});

type CalendarView = "month" | "agenda";
type CustomView = "tabla" | CalendarView;

export type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: MatchDTO;
};

interface TokenPayload {
  sub: string;
  role: string;
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function CustomEvent({ event }: { event: CalendarEvent }) {
  return (
    <div
      style={{
        fontSize: "0.78rem",
        lineHeight: "1.2",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontWeight: 500,
      }}
      title={`${event.resource.homeTeamName} vs ${event.resource.awayTeamName} (${formatTime(event.resource.startTime)}-${formatTime(event.resource.endTime)})`}
    >
      {event.resource.homeTeamName} vs {event.resource.awayTeamName}{" "}
      <span style={{ color: "#374151" }}>
        ({formatTime(event.resource.startTime)}-{formatTime(event.resource.endTime)})
      </span>
    </div>
  );
}

function CustomAgendaDateHeader({ label, date }: { label: string; date: any }) {
  if (date instanceof Date && !isNaN(date.getTime())) {
    const texto = format(date, "EEEE, d 'de' MMMM", { locale: es });
    return <span style={{ textTransform: "capitalize" }}>{texto}</span>;
  }
  return <span>{label}</span>;
}

export default function MatchesPublic() {
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<MatchDTO[]>([]);
  const [view, setView] = useState<CustomView>("tabla");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchDTO | null>(null);

  const token = localStorage.getItem("token");
  let role = "";
  if (token) {
    const payload: TokenPayload = jwtDecode(token);
    role = payload.role;
  }

  useEffect(() => {
    getMatches()
      .then((data) => {
        const sortedMatches = data.sort((a, b) => {
          if (a.status === "PENDING" && b.status !== "PENDING") return -1;
          if (a.status !== "PENDING" && b.status === "PENDING") return 1;
          return 0;
        });

        const pendingOnly = role === "MESA";
        const visibleMatches = pendingOnly
          ? sortedMatches.filter((m) => m.status === "PENDING")
          : sortedMatches;

        setMatches(visibleMatches);
        setFiltered(visibleMatches);
        setLoading(false);

        const calendarEvents: CalendarEvent[] = visibleMatches.map((match) => ({
          title: `${match.homeTeamName} vs ${match.awayTeamName} (${match.location})`,
          start: new Date(`${match.date}T${match.startTime}`),
          end: new Date(`${match.date}T${match.endTime}`),
          allDay: false,
          resource: match,
        }));
        setEvents(calendarEvents);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFiltered(
      matches.filter(
        (m) =>
          m.homeTeamName.toLowerCase().includes(search.toLowerCase()) ||
          m.awayTeamName.toLowerCase().includes(search.toLowerCase()) ||
          m.location.toLowerCase().includes(search.toLowerCase()) ||
          m.date.includes(search)
      )
    );
  }, [search, matches]);

  if (loading) return <div className="text-center mt-6">Cargando partidos...</div>;

  function handleSelectEvent(event: CalendarEvent) {
    setSelectedMatch(event.resource);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedMatch(null);
  }

  return (
    <div className="max-w-5xl mx-auto my-8 p-4 bg-white rounded-2xl shadow-xl relative">

      {/* CABECERA MEJORADA */}
      <div
        className="rounded-t-2xl"
        style={{
          background: "linear-gradient(90deg, #1866c9 0%, #41a5ee 100%)",
          padding: "2.2rem 2rem 2.6rem 2rem",
          margin: "-1.5rem -1.5rem 0 -1.5rem",
          borderTopLeftRadius: "1.25rem",
          borderTopRightRadius: "1.25rem",
          textAlign: "center"
        }}
      >
        <h2 className="text-2xl font-bold text-white drop-shadow mb-2" style={{ letterSpacing: 0.5 }}>
          Programación de Partidos
        </h2>

        {/* Toggle Tabs moderno */}
        <div className="flex justify-center gap-3 mt-4 mb-2">
          <button
            className={`
              px-7 py-2 rounded-full font-bold text-base transition-all duration-200
              shadow border-2
              ${view === "tabla"
                ? "bg-white border-blue-700 text-blue-700 shadow-lg scale-105"
                : "bg-blue-500/20 border-blue-200 text-blue-100 hover:bg-white/10 hover:text-white"}
            `}
            style={{
              minWidth: 120,
              boxShadow: view === "tabla"
                ? "0 4px 20px 0 rgba(34, 197, 253, 0.16)"
                : undefined
            }}
            onClick={() => setView("tabla")}
          >
            Tabla
          </button>
          <button
            className={`
              px-7 py-2 rounded-full font-bold text-base transition-all duration-200
              shadow border-2
              ${view !== "tabla"
                ? "bg-white border-blue-700 text-blue-700 shadow-lg scale-105"
                : "bg-blue-500/20 border-blue-200 text-blue-100 hover:bg-white/10 hover:text-white"}
            `}
            style={{
              minWidth: 120,
              boxShadow: view !== "tabla"
                ? "0 4px 20px 0 rgba(34, 197, 253, 0.16)"
                : undefined
            }}
            onClick={() => setView("month")}
          >
            Calendario
          </button>
        </div>
      </div>

      {/* FILTRO */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Buscar por equipo, lugar o fecha"
          className="border border-gray-300 rounded-lg px-3 py-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLA */}
      {view === "tabla" && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Hora</th>
                  <th className="px-4 py-2">Local</th>
                  <th className="px-4 py-2">Visitante</th>
                  <th className="px-4 py-2">Lugar</th>
                  <th className="px-4 py-2">Estado</th>
                  {role === "MESA" && <th className="px-4 py-2">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((match) => {
                  const actionCell =
                    role === "MESA" ? (
                      <td className="px-4 py-2">
                        {match.status === "PENDING" ? (
                          <a href={`/my-matches/${match.id}/events`} className="text-blue-600 hover:underline text-sm font-semibold">
                            <span className="btn-primary btn-xs">📝 Registrar eventos</span>
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    ) : null;

                  return (
                    <tr key={match.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2">{match.date}</td>
                      <td className="px-4 py-2">{formatTime(match.startTime)} - {formatTime(match.endTime)}</td>
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
                      {actionCell}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center text-gray-500 mt-4">No se encontraron partidos disponibles</div>}
          </div>
        </>
      )}

      {/* CALENDARIO */}
      {view !== "tabla" && (
        <div>
          <Calendar
            culture="es"
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={(newView: CalendarView) => setView(newView)}
            date={currentDate}
            onNavigate={(date: Date) => setCurrentDate(date)}
            messages={{
              next: "Sig",
              previous: "Ant",
              today: "Hoy",
              month: "Mes",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              allDay: "Todo el día",
              noEventsInRange: "No hay partidos en este rango",
              showMore: (total: number) => `+ Ver más (${total})`,
            }}
            views={["month", "agenda"]}
            popup={true}
            eventPropGetter={(event: CalendarEvent) => {
              const bgColor =
                event.resource.status === "PENDING"
                  ? "#FACC15"
                  : event.resource.status === "COMPLETED"
                  ? "#22C55E"
                  : "#EF4444";
              return {
                style: {
                  backgroundColor: bgColor,
                  color: "black",
                  borderRadius: 6,
                  padding: "1px 2px",
                  fontWeight: 500,
                  fontSize: "0.78rem",
                },
              };
            }}
            onSelectEvent={handleSelectEvent}
            components={{
              event: CustomEvent,
              agenda: { date: CustomAgendaDateHeader },
            }}
            tooltipAccessor={(event: CalendarEvent) =>
              `${event.resource.homeTeamName} vs ${event.resource.awayTeamName}\n${formatTime(event.resource.startTime)} - ${formatTime(event.resource.endTime)}\n${event.resource.location}`
            }
          />
        </div>
      )}

      {/* MODAL DETALLE DE PARTIDO */}
      {modalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 font-bold text-xl"
              onClick={closeModal}
              aria-label="Cerrar modal"
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-4">
              {selectedMatch.homeTeamName} vs {selectedMatch.awayTeamName}
            </h3>
            <p><strong>Fecha:</strong> {selectedMatch.date}</p>
            <p><strong>Hora:</strong> {formatTime(selectedMatch.startTime)} - {formatTime(selectedMatch.endTime)}</p>
            <p><strong>Lugar:</strong> {selectedMatch.location}</p>
            <p><strong>Estado:</strong> {selectedMatch.status === "PENDING" ? "Pendiente" : selectedMatch.status === "COMPLETED" ? "Jugado" : "Cancelado"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
