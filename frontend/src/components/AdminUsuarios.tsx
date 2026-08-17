import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, UserPlus, ArrowLeft, RefreshCw, Save, Edit2 } from 'lucide-react';

interface Rol {
  id: number;
  nombre: string;
}

interface Usuario {
  id: string; // varchar(30) en PostgreSQL
  nombre: string;
  email: string;
  departamento: string | null;
  rol_id: number;
  rol_nombre: string;
}

interface AdminUsuariosProps {
  onBack: () => void;
}

export default function AdminUsuarios({ onBack }: AdminUsuariosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null); // null = Modo Crear Nuevo
  
  // Estados del Formulario
  const [idInput, setIdInput] = useState(''); // Requerido solo al crear nuevo
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Opcional en edición
  const [departamento, setDepartamento] = useState('');
  const [rolId, setRolId] = useState<string>('');
  
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem('sap_token');
      const header = { headers: { Authorization: `Bearer ${token}` } };
      
      const resRoles = await axios.get('http://localhost:4000/api/roles', header);
      const resUsuarios = await axios.get('http://localhost:4000/api/usuarios', header);

      if (resRoles.data.success) setRoles(resRoles.data.data);
      if (resUsuarios.data.success) setUsuarios(resUsuarios.data.data);
    } catch (err) {
      setMensaje({ texto: 'Error al cargar la lista de usuarios o roles corporativos.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSeleccionarEditar = (user: Usuario) => {
    setMensaje({ texto: '', tipo: '' });
    setUsuarioSeleccionado(user);
    setIdInput(user.id);
    setNombre(user.nombre);
    setEmail(user.email);
    setDepartamento(user.departamento || '');
    setRolId(String(user.rol_id));
    setPassword(''); // Dejar vacío por seguridad para que no se altere a menos que se digite una nueva
  };

  const handleModoCrear = () => {
    setUsuarioSeleccionado(null);
    setIdInput('');
    setNombre('');
    setEmail('');
    setPassword('');
    setDepartamento('');
    setRolId('');
    setMensaje({ texto: '', tipo: '' });
  };

  const handleGuardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones previas
    if (!idInput.trim() || !nombre.trim() || !email.trim() || !rolId) {
      return setMensaje({ texto: 'Por favor, completa todos los campos obligatorios (*).', tipo: 'error' });
    }
    if (!usuarioSeleccionado && !password) {
      return setMensaje({ texto: 'La contraseña es obligatoria para registrar nuevos usuarios.', tipo: 'error' });
    }

    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const token = localStorage.getItem('sap_token');
      const esEdicion = !!usuarioSeleccionado;
      
      const url = esEdicion 
        ? `http://localhost:4000/api/usuarios/${usuarioSeleccionado.id}`
        : 'http://localhost:4000/api/usuarios/crear';
      
      const metodo = esEdicion ? 'put' : 'post';

      const payload = {
        id: idInput.trim(),
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password: password || undefined, // Si va vacío en PUT, el backend no altera la contraseña actual
        departamento: departamento.trim() || null,
        rol_id: Number(rolId)
      };

      const res = await axios[metodo](url, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data.success) {
        setMensaje({ 
          texto: esEdicion ? 'Usuario actualizado con éxito.' : 'Usuario registrado con éxito.', 
          tipo: 'success' 
        });
        handleModoCrear();
        cargarDatos();
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

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', flex: 1, overflowY: 'auto', width: '100%' }}>
      <header style={{ marginBottom: '20px' }}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Volver al Repositorio</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Users size={22} color="#452b1b" />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            Consola de Gestión de Usuarios y Accesos
          </h2>
        </div>
      </header>

      <div style={styles.layoutSplit}>
        {/* Panel Izquierdo: Lista de Usuarios */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTitleSection}>
            <span>Usuarios del Sistema</span>
            <button onClick={handleModoCrear} style={styles.addBtnIcon} title="Nuevo Usuario">
              <UserPlus size={16} />
            </button>
          </div>
          
          {cargando ? (
            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginTop: '10px' }}>Cargando usuarios...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div onClick={handleModoCrear} style={!usuarioSeleccionado ? styles.rowActive : styles.rowNuevo}>
                <UserPlus size={13} />
                <span>[ Registrar Nuevo Usuario ]</span>
              </div>
              {usuarios.map((u) => (
                <div 
                  key={u.id} 
                  onClick={() => handleSeleccionarEditar(u)}
                  style={usuarioSeleccionado?.id === u.id ? styles.rowActive : styles.row}
                >
                  <Edit2 size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {u.nombre}
                    </span>
                    <span style={{ fontSize: '11px', opacity: 0.8 }}>
                      ID: {u.id} | Rol: {u.rol_nombre || 'Sin asignación'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Derecho: Formulario Dinámico */}
        <form onSubmit={handleGuardarUsuario} style={styles.cardForm}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#452b1b' }}>
            {usuarioSeleccionado ? `⚙️ Editando Perfil: ${usuarioSeleccionado.nombre}` : '✨ Registrar Credenciales de Usuario'}
          </h3>

          {mensaje.texto && (
            <div style={mensaje.tipo === 'error' ? styles.errorBanner : styles.successBanner}>
              {mensaje.texto}
            </div>
          )}

          <div style={styles.gridTwoColumns}>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>ID / Código único *</label>
              <input
                type="text"
                placeholder="Ej: USR-1092 o Cédula"
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                style={styles.input}
                disabled={guardando || !!usuarioSeleccionado} // Inmutable en edición por ser PKEY
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Nombre Completo *</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={styles.input}
                disabled={guardando}
              />
            </div>
          </div>

          <div style={styles.gridTwoColumns}>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Correo Electrónico *</label>
              <input
                type="email"
                placeholder="ejemplo@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={guardando}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>Contraseña {usuarioSeleccionado && '(Opcional)'}</label>
              <input
                type="password"
                placeholder={usuarioSeleccionado ? "Dejar en blanco para conservar actual" : "Mínimo 6 caracteres"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={guardando}
              />
            </div>
          </div>

          <div style={styles.gridTwoColumns}>
            <div style={{ marginBottom: '24px' }}>
              <label style={styles.label}>Departamento / Área</label>
              <input
                type="text"
                placeholder="Ej: Contabilidad, Sistemas"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                style={styles.input}
                disabled={guardando}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={styles.label}>Asignar Rol Corporativo *</label>
              <select 
                value={rolId} 
                onChange={(e) => setRolId(e.target.value)} 
                style={styles.select}
                disabled={guardando}
              >
                <option value="">-- Selecciona un Perfil de Rol --</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" disabled={guardando} style={styles.saveBtn}>
            {guardando ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            <span>{usuarioSeleccionado ? 'Actualizar Ficha de Usuario' : 'Guardar y Activar Usuario'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  layoutSplit: { display: 'flex', gap: '20px', alignItems: 'flex-start', height: 'calc(100vh - 140px)' },
  sidebar: { width: '320px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' as const, maxHeight: '100%', overflowY: 'auto' as const },
  sidebarTitleSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' },
  addBtnIcon: { border: 'none', backgroundColor: 'transparent', color: '#059669', cursor: 'pointer', padding: 2 },
  row: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#334155', transition: 'background 0.2s' },
  rowNuevo: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#059669', fontWeight: 600 },
  rowActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', backgroundColor: '#452b1b', color: '#ffffff' },
  cardForm: { flex: 1, backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  gridTwoColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', padding: 0 },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#445164', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' as const, outline: 'none' },
  select: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#ffffff', outline: 'none' },
  saveBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', backgroundColor: '#452b1b', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: '10px' },
  errorBanner: { padding: '12px 16px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  successBanner: { padding: '12px 16px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 },
};