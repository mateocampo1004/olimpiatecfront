import { useEffect, useState } from "react";
import {
  getPendingTeams, getPendingPlayers,
  validateTeam, validatePlayer,
  editTeam, editPlayer,
  rejectTeam, rejectPlayer
} from "../api/validation";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ValidationPanel() {
  const token = localStorage.getItem("token")!;
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  // Dialog para rechazos
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "TEAM" | "PLAYER" | null;
    id: number | null;
    name: string;
  }>({ isOpen: false, type: null, id: null, name: "" });

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const [resTeams, resPlayers] = await Promise.all([
        getPendingTeams(token),
        getPendingPlayers(token)
      ]);
      setTeams(resTeams);
      setPlayers(resPlayers);
    } catch (error) {
      setMessage("Error al cargar datos pendientes");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateTeam = async (id: number) => {
    try {
      await validateTeam(id, token);
      setMessage("Equipo validado correctamente");
      loadPending();
    } catch {
      setMessage("Error al validar equipo");
    }
  };

  const handleValidatePlayer = async (id: number) => {
    try {
      await validatePlayer(id, token);
      setMessage("Jugador validado correctamente");
      loadPending();
    } catch {
      setMessage("Error al validar jugador");
    }
  };

  // USAR CONFIRMDIALOG EN VEZ DE window.confirm
  const handleRejectTeam = (id: number, name: string) => {
    setConfirmDialog({ isOpen: true, type: "TEAM", id, name });
  };

  const handleRejectPlayer = (id: number, name: string) => {
    setConfirmDialog({ isOpen: true, type: "PLAYER", id, name });
  };

  const handleConfirmReject = async () => {
    if (!confirmDialog.id || !confirmDialog.type) return;
    try {
      if (confirmDialog.type === "TEAM") {
        await rejectTeam(confirmDialog.id, token);
        setMessage("Equipo rechazado");
      } else if (confirmDialog.type === "PLAYER") {
        await rejectPlayer(confirmDialog.id, token);
        setMessage("Jugador rechazado");
      }
      loadPending();
    } catch {
      setMessage("Error al rechazar");
    } finally {
      setConfirmDialog({ isOpen: false, type: null, id: null, name: "" });
    }
  };

  const handleEditTeam = (team: any) => {
    setEditingTeam({ ...team });
    setShowTeamModal(true);
  };

  const handleEditPlayer = (player: any) => {
    setEditingPlayer({ ...player });
    setShowPlayerModal(true);
  };

  const handleSaveTeamEdit = async () => {
    if (editingTeam) {
      if (!editingTeam.name || !editingTeam.contactNumber) {
        setMessage("Todos los campos son obligatorios");
        return;
      }

      try {
        await editTeam(editingTeam.id, {
          name: editingTeam.name,
          contactNumber: editingTeam.contactNumber
        }, token);
        setMessage("Equipo editado correctamente");
        setEditingTeam(null);
        setShowTeamModal(false);
        loadPending();
      } catch (err: any) {
        setMessage(err?.response?.data || "Error al editar el equipo");
      }
    }
  };

  const handleSavePlayerEdit = async () => {
    if (editingPlayer) {
      if (!editingPlayer.name || !editingPlayer.cedula || !editingPlayer.carrera) {
        setMessage("Todos los campos son obligatorios");
        return;
      }

      if (!/^\d{10}$/.test(editingPlayer.cedula)) {
        setMessage("La cédula debe tener exactamente 10 dígitos numéricos");
        return;
      }

      if (editingPlayer.dorsal <= 0) {
        setMessage("El dorsal debe ser mayor a 0");
        return;
      }

      try {
        await editPlayer(editingPlayer.id, {
          name: editingPlayer.name,
          cedula: editingPlayer.cedula,
          dorsal: editingPlayer.dorsal,
          carrera: editingPlayer.carrera
        }, token);
        setMessage("Jugador editado correctamente");
        setEditingPlayer(null);
        setShowPlayerModal(false);
        loadPending();
      } catch (err: any) {
        setMessage(err?.response?.data || "Error al editar el jugador");
      }
    }
  };

  const teamColumns = [
    {
      key: 'name',
      label: 'Nombre del Equipo',
      sortable: true
    },
    {
      key: 'contactNumber',
      label: 'Número de Contacto',
      sortable: true
    },
    {
      key: 'representativeName',
      label: 'Representante',
      sortable: true
    },
    {
      key: 'validated',
      label: 'Estado',
      align: 'center' as const,
      render: (validated: boolean) => (
        <StatusBadge status={validated ? 'VALIDATED' : 'NOT_VALIDATED'} size="sm" />
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center' as const,
      render: (_: any, team: any) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn-tertiary btn-xs"
            onClick={(e) => { e.stopPropagation(); handleValidateTeam(team.id); }}
          >
            ✅ Validar
          </button>
          <button 
            className="btn-primary btn-xs"
            onClick={(e) => { e.stopPropagation(); handleEditTeam(team); }}
          >
            ✏️ Editar
          </button>
          <button 
            className="btn-secondary btn-xs"
            onClick={(e) => { e.stopPropagation(); handleRejectTeam(team.id, team.name); }}
          >
            🗑️ Rechazar
          </button>
        </div>
      )
    }
  ];

  const playerColumns = [
    {
      key: 'name',
      label: 'Nombre',
      sortable: true
    },
    {
      key: 'cedula',
      label: 'Cédula',
      sortable: true
    },
    {
      key: 'dorsal',
      label: 'Dorsal',
      sortable: true,
      align: 'center' as const
    },
    {
      key: 'carrera',
      label: 'Carrera',
      sortable: true
    },
    {
      key: 'teamName',
      label: 'Equipo',
      sortable: true
    },
    {
      key: 'validated',
      label: 'Estado',
      align: 'center' as const,
      render: (validated: boolean) => (
        <StatusBadge status={validated ? 'VALIDATED' : 'NOT_VALIDATED'} size="sm" />
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      align: 'center' as const,
      render: (_: any, player: any) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn-tertiary btn-xs"
            onClick={(e) => { e.stopPropagation(); handleValidatePlayer(player.id); }}
          >
            ✅ Validar
          </button>
          <button 
            className="btn-primary btn-xs"
            onClick={(e) => { e.stopPropagation(); handleEditPlayer(player); }}
          >
            ✏️ Editar
          </button>
          <button 
            className="btn-secondary btn-xs"
            onClick={(e) => { e.stopPropagation(); handleRejectPlayer(player.id, player.name); }}
          >
            🗑️ Rechazar
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#374151',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
           Panel de Validación
        </h1>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '1.1rem',
          margin: 0 
        }}>
          Revisa y valida equipos y jugadores pendientes de aprobación
        </p>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '24px',
          background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
          color: message.includes('Error') ? '#991b1b' : '#065f46',
          borderRadius: '12px',
          border: `1px solid ${message.includes('Error') ? '#fca5a5' : '#a7f3d0'}`,
          fontWeight: '500'
        }}>
          {message}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
            {teams.length}
          </div>
          <div style={{ fontSize: '1rem', opacity: 0.9 }}>
            Equipos Pendientes
          </div>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
            {players.length}
          </div>
          <div style={{ fontSize: '1rem', opacity: 0.9 }}>
            Jugadores Pendientes
          </div>
        </div>
      </div>

      {/* Teams Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ⚽ Validación de Equipos
        </h2>
        
        {teams.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#374151', marginBottom: '8px' }}>No hay equipos pendientes</h3>
            <p>Todos los equipos han sido validados</p>
          </div>
        ) : (
          <DataTable
            data={teams}
            columns={teamColumns}
            loading={loading}
            emptyMessage="No hay equipos pendientes"
            hoverable
            striped
          />
        )}
      </div>

      {/* Players Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#1f2937',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          👤 Validación de Jugadores
        </h2>
        
        {players.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#374151', marginBottom: '8px' }}>No hay jugadores pendientes</h3>
            <p>Todos los jugadores han sido validados</p>
          </div>
        ) : (
          <DataTable
            data={players}
            columns={playerColumns}
            loading={loading}
            emptyMessage="No hay jugadores pendientes"
            hoverable
            striped
          />
        )}
      </div>

      {/* Team Edit Modal */}
      <Modal
        isOpen={showTeamModal}
        onClose={() => { setShowTeamModal(false); setEditingTeam(null); }}
        title="Editar Equipo"
        size="md"
      >
        {editingTeam && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Nombre del Equipo
              </label>
              <input 
                type="text" 
                value={editingTeam.name} 
                onChange={e => setEditingTeam({ ...editingTeam, name: e.target.value })} 
                placeholder="Nombre del equipo"
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Número de Contacto
              </label>
              <input 
                type="text" 
                value={editingTeam.contactNumber} 
                onChange={e => setEditingTeam({ ...editingTeam, contactNumber: e.target.value })} 
                placeholder="Número de contacto"
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-tertiary" onClick={handleSaveTeamEdit}>
                💾 Guardar Cambios
              </button>
              <button 
                className="btn-neutral" 
                onClick={() => { setShowTeamModal(false); setEditingTeam(null); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Player Edit Modal */}
      <Modal
        isOpen={showPlayerModal}
        onClose={() => { setShowPlayerModal(false); setEditingPlayer(null); }}
        title="Editar Jugador"
        size="md"
      >
        {editingPlayer && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Nombre del Jugador
              </label>
              <input 
                type="text" 
                value={editingPlayer.name} 
                onChange={e => setEditingPlayer({ ...editingPlayer, name: e.target.value })} 
                placeholder="Nombre completo"
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                Cédula
              </label>
              <input 
                type="text" 
                value={editingPlayer.cedula} 
                onChange={e => setEditingPlayer({ ...editingPlayer, cedula: e.target.value })} 
                placeholder="1234567890"
                maxLength={10}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Dorsal
                </label>
                <input 
                  type="number" 
                  value={editingPlayer.dorsal} 
                  onChange={e => setEditingPlayer({ ...editingPlayer, dorsal: parseInt(e.target.value) || 0 })} 
                  placeholder="10"
                  min="1"
                  max="99"
                  style={{ width: '100%' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                  Carrera
                </label>
                <input 
                  type="text" 
                  value={editingPlayer.carrera} 
                  onChange={e => setEditingPlayer({ ...editingPlayer, carrera: e.target.value })} 
                  placeholder="Ingeniería en Sistemas"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-tertiary" onClick={handleSavePlayerEdit}>
                💾 Guardar Cambios
              </button>
              <button 
                className="btn-neutral" 
                onClick={() => { setShowPlayerModal(false); setEditingPlayer(null); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: null, id: null, name: "" })}
        onConfirm={handleConfirmReject}
        title={`Rechazar ${confirmDialog.type === "TEAM" ? "equipo" : "jugador"}`}
        message={`¿Estás seguro de que deseas rechazar ${confirmDialog.type === "TEAM" ? `el equipo "${confirmDialog.name}"` : `al jugador "${confirmDialog.name}"`}?\nEsta acción no se puede deshacer.`}
        confirmText="Rechazar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
