import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, Folder, Save, ArrowLeft, CheckSquare, Square, RefreshCw, Edit2, Plus } from 'lucide-react';

interface FolderNode {
  id: number;
  nombre: string;
  padre_id: number | null;
  subcarpetas: FolderNode[];
}

interface Rol {
  id: number;
  nombre: string;
}

interface AdminRolesProps {
  arbolCarpetas: FolderNode[];
  onBack: () => void;
}

export default function AdminRoles({ arbolCarpetas, onBack }: AdminRolesProps) {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<Rol | null>(null); // null = Modo Creación
  
  const [nombreRol, setNombreRol] = useState('');
  const [carpetasSeleccionadas, setCarpetasSeleccionadas] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [cargandoRoles, setCargandoRoles] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const obtenerRolesExistentes = async () => {
    setCargandoRoles(true);
    try {
      const token = localStorage.getItem('sap_token');
      const res = await axios.get('http://localhost:4000/api/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRoles(res.data.data || res.data);
      }
    } catch (err) {
      setMensaje({ texto: 'No se pudo cargar la lista de roles activos.', tipo: 'error' });
    } finally {
      setCargandoRoles(false);
    }
  };

  useEffect(() => {
    obtenerRolesExistentes();
  }, []);

  const handleSeleccionarEditar = async (rol: Rol) => {
    setMensaje({ texto: '', tipo: '' });
    setRolSeleccionado(rol);
    setNombreRol(rol.nombre);
    setGuardando(true);

    try {
      const token = localStorage.getItem('sap_token');
      const resPermisos = await axios.get(`http://localhost:4000/api/roles/${rol.id}/carpetas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resPermisos.data.success) {
        setCarpetasSeleccionadas(resPermisos.data.data);
      } else {
        setCarpetasSeleccionadas(resPermisos.data);
      }
    } catch (err) {
      setMensaje({ texto: 'Error al recuperar las carpetas asignadas a este rol.', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  const handleModoCrearNuevo = () => {
    setRolSeleccionado(null);
    setNombreRol('');
    setCarpetasSeleccionadas([]);
    setMensaje({ texto: '', tipo: '' });
  };

  const handleToggleFolder = (id: number) => {
    setCarpetasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGuardarRol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreRol.trim()) {
      return setMensaje({ texto: 'Por favor, escribe un nombre para el rol.', tipo: 'error' });
    }
    if (carpetasSeleccionadas.length === 0) {
      return setMensaje({ texto: 'Debes asignar al menos una carpeta a este rol.', tipo: 'error' });
    }

    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const token = localStorage.getItem('sap_token');
      const esEdicion = !!rolSeleccionado;
      
      const url = esEdicion 
        ? `http://localhost:4000/api/roles/actualizar-con-permisos/${rolSeleccionado.id}`
        : 'http://localhost:4000/api/roles/crear-con-permisos';

      const metodo = esEdicion ? 'put' : 'post';

      const res = await axios[metodo](
        url,
        {
          nombre: nombreRol.trim().toUpperCase(),
          carpetas: carpetasSeleccionadas,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMensaje({ 
          texto: esEdicion ? `Rol actualizado de forma exitosa.` : `Rol "${nombreRol.toUpperCase()}" creado exitosamente.`, 
          tipo: 'success' 
        });
        handleModoCrearNuevo();
        obtenerRolesExistentes(); 
      }
    } catch (err: any) {
      setMensaje({ 
        texto: err.response?.data?.message || 'Error al procesar la solicitud en el servidor.', 
        tipo: 'error' 
      });
    } finally {
      setGuardando(false);
    }
  };

  const FolderCheckItem = ({ node }: { node: FolderNode }) => {
    const isChecked = carpetasSeleccionadas.includes(node.id);
    const tieneHijos = node.subcarpetas && node.subcarpetas.length > 0;

    return (
      <div style={{ marginLeft: 16, marginTop: 6 }}>
        <div 
          onClick={() => handleToggleFolder(node.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}
        >
          {isChecked ? <CheckSquare size={16} color="#059669" /> : <Square size={16} color="#64748b" />}
          <Folder size={15} color="#452b1b" />
          <span style={{ fontSize: '13px', color: '#1e293b' }}>{node.nombre}</span>
        </div>
        {tieneHijos && (
          <div style={{ borderLeft: '1px dashed #cbd5e1', marginLeft: 6 }}>
            {node.subcarpetas.map((child) => (
              <FolderCheckItem key={child.id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', flex: 1, overflowY: 'auto', width: '100%' }}>
      <header style={{ marginBottom: '20px' }}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Volver al Repositorio</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Shield size={22} color="#452b1b" />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            Consola de Administración de Roles y Permisos
          </h2>
        </div>
      </header>

      <div style={styles.adminLayoutSplit}>
        <div style={styles.rolesSidebar}>
          <div style={styles.sidebarSectionTitle}>
            <span>Roles del Sistema</span>
            <button onClick={handleModoCrearNuevo} style={styles.addBtnIcon} title="Nuevo Rol">
              <Plus size={16} />
            </button>
          </div>
          
          {cargandoRoles ? (
            <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Cargando...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div 
                onClick={handleModoCrearNuevo}
                style={!rolSeleccionado ? styles.rolRowActive : styles.rolRowNuevo}
              >
                <Plus size={13} />
                <span>[ Crear Nuevo Rol ]</span>
              </div>
              {roles.map((r) => (
                <div 
                  key={r.id} 
                  onClick={() => handleSeleccionarEditar(r)}
                  style={rolSeleccionado?.id === r.id ? styles.rolRowActive : styles.rolRow}
                >
                  <Edit2 size={12} style={{ opacity: 0.7 }} />
                  <span style={{ fontWeight: 500 }}>{r.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleGuardarRol} style={styles.cardAdmin}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#452b1b' }}>
            {rolSeleccionado ? `⚙️ Editando Accesos de: ${rolSeleccionado.nombre}` : '✨ Configurar Nuevo Perfil de Rol'}
          </h3>

          {mensaje.texto && (
            <div style={mensaje.tipo === 'error' ? styles.errorBanner : styles.successBanner}>
              {mensaje.texto}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={styles.labelAdmin}>Nombre del Rol</label>
            <input
              type="text"
              placeholder="Ej: AUDITORIA, OPERACIONES"
              value={nombreRol}
              onChange={(e) => setNombreRol(e.target.value)}
              style={styles.inputAdmin}
              disabled={guardando}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={styles.labelAdmin}>Mapeo de Carpetas Asignadas</label>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b' }}>
              Selecciona los módulos a los que los usuarios con este rol tendrán herencia de acceso.
            </p>

            <div style={styles.treeViewportAdmin}>
              {arbolCarpetas.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: 20 }}>
                  Catálogo de directorios vacío o cargando...
                </p>
              ) : (
                arbolCarpetas.map((rootNode) => (
                  <FolderCheckItem key={rootNode.id} node={rootNode} />
                ))
              )}
            </div>
          </div>

          <button type="submit" disabled={guardando} style={styles.saveBtnAdmin}>
            {guardando ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            <span>{rolSeleccionado ? 'Actualizar Cambios del Rol' : 'Crear Rol y Guardar Permisos'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  adminLayoutSplit: { display: 'flex', gap: '20px', alignItems: 'flex-start', height: 'calc(100vh - 140px)' },
  rolesSidebar: { width: '260px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' as const, maxHeight: '100%', overflowY: 'auto' as const },
  sidebarSectionTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' },
  addBtnIcon: { border: 'none', backgroundColor: 'transparent', color: '#059669', cursor: 'pointer', padding: 2 },
  rolRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#334155', transition: 'background 0.2s' },
  rolRowNuevo: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#059669', fontWeight: 600 },
  rolRowActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', backgroundColor: '#452b1b', color: '#ffffff' },
  cardAdmin: { flex: 1, backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', maxHeight: '100%', overflowY: 'auto' as const },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', padding: 0 },
  labelAdmin: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '6px' },
  inputAdmin: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' as const, textTransform: 'uppercase' as const, outline: 'none' },
  treeViewportAdmin: { border: '1px solid #cbd5e1', borderRadius: '6px', padding: '12px', maxHeight: '280px', overflowY: 'auto' as const, backgroundColor: '#f8fafc' },
  saveBtnAdmin: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', backgroundColor: '#452b1b', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '8px' },
  errorBanner: { padding: '12px 16px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  successBanner: { padding: '12px 16px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 },
};