import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FileText, LogOut, RefreshCw, Folder, Search, Download, 
  ChevronDown, ChevronRight
} from 'lucide-react'; 
import logoDelMonte from '../assets/logo-nuevo-01.png';
import AdminRoles from './AdminRoles'; 
import AdminUsuarios from './AdminUsuarios';

interface Reporte {
  id: number;
  nombre_archivo: string;
  tamano_mb: number;
  fecha_modificacion: string;
  carpeta_id: number;
  carpeta: string;
}

interface FolderNode {
  id: number;
  nombre: string;
  padre_id: number | null;
  subcarpetas: FolderNode[];
}

interface DashboardProps {
  onLogout: () => void;
}

const TreeNode = ({ node, carpetaSeleccionadaId, onSelect }: { node: FolderNode; carpetaSeleccionadaId: number | 'TODAS'; onSelect: (id: number, nombre: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tieneHijos = node.subcarpetas && node.subcarpetas.length > 0;
  const esActivo = carpetaSeleccionadaId === node.id;

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id, node.nombre);
    if (tieneHijos) setIsOpen(!isOpen);
  };

  return (
    <div style={{ marginLeft: 12, marginTop: 4 }}>
      <div onClick={handleSelect} style={esActivo ? styles.treeNodeActive : styles.treeNode}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {tieneHijos ? (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <div style={{ width: 14 }} />}
          <Folder size={15} color={esActivo ? '#ffffff' : '#452b1b'} />
          <span style={{ fontSize: '13px' }}>{node.nombre}</span>
        </div>
      </div>
      {isOpen && tieneHijos && (
        <div style={{ borderLeft: '1px dashed #cbd5e1', marginLeft: 6 }}>
          {node.subcarpetas.map(child => (
            <TreeNode key={child.id} node={child} carpetaSeleccionadaId={carpetaSeleccionadaId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function Dashboard({ onLogout }: DashboardProps) {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [arbolCarpetas, setArbolCarpetas] = useState<FolderNode[]>([]); 
  const [carpetaSeleccionadaId, setCarpetaSeleccionadaId] = useState<number | 'TODAS'>('TODAS'); 
  const [carpetaNombre, setCarpetaNombre] = useState<string>('Repositorio Global');
  const [busqueda, setBusqueda] = useState<string>(''); 
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  const [vistaActual, setVistaActual] = useState<'VISOR' | 'ADMIN_ROLES' | 'ADMIN_USUARIOS'>('VISOR');
  const [usuarioRol, setUsuarioRol] = useState<string>('');

  const cargarDatosDashboard = async () => {
    setCargando(true);
    setError('');
    try {
      const token = localStorage.getItem('sap_token');

      const resCarpetas = await axios.get('http://localhost:4000/api/carpetas/autorizadas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArbolCarpetas(resCarpetas.data);

      const resReportes = await axios.get('http://localhost:4000/api/reportes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (resReportes.data.success) {
        setReportes(resReportes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor de Del Monte');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const rolGuardado = localStorage.getItem('user_role') || '0'; 
    setUsuarioRol(rolGuardado);
    cargarDatosDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sap_token');
    localStorage.removeItem('user_role');
    onLogout();
  };

  const handleSelectFolder = (id: number, nombre: string) => {
    setCarpetaSeleccionadaId(id);
    setCarpetaNombre(nombre);
  };

  const formatearTamaño = (mb: number) => {
    return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(2)} MB`;
  };

  const reportesFiltrados = reportes.filter(r => {
    const cumpleCarpeta = 
      carpetaSeleccionadaId === 'TODAS' || 
      String(r.carpeta).trim().toUpperCase() === String(carpetaNombre).trim().toUpperCase();
      
    const cumpleBusqueda = r.nombre_archivo.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleCarpeta && cumpleBusqueda;
  });

  const descargarArchivo = async (id: number, nombreArchivo: string) => {
    try {
      const token = localStorage.getItem('sap_token');
      const respuesta = await axios.get(`http://localhost:4000/api/reportes/descargar/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([respuesta.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('No se pudo descargar el archivo. Verifica tus permisos de red.');
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* BARRA SUPERIOR */}
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <img src={logoDelMonte} alt="Del Monte AG" style={styles.navLogo} />
          <div style={styles.divider}></div>
          <span style={styles.brandText}>Sistema Operativo de Reportes</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {usuarioRol === '1' && (
            <>
              <button 
                onClick={() => setVistaActual(vistaActual === 'ADMIN_ROLES' ? 'VISOR' : 'ADMIN_ROLES')} 
                style={vistaActual === 'ADMIN_ROLES' ? styles.adminActiveBtn : styles.adminBtn}
              >
                <span>Roles</span>
              </button>
              <button 
                onClick={() => setVistaActual(vistaActual === 'ADMIN_USUARIOS' ? 'VISOR' : 'ADMIN_USUARIOS')} 
                style={vistaActual === 'ADMIN_USUARIOS' ? styles.adminActiveBtn : styles.adminBtn}
              >
                <span>Usuarios</span>
              </button>
              <button 
                onClick={() => setVistaActual(vistaActual === 'ADMIN_USUARIOS' ? 'VISOR' : 'ADMIN_USUARIOS')} 
                style={vistaActual === 'ADMIN_USUARIOS' ? styles.adminActiveBtn : styles.adminBtn}
              >
                <span>Logs</span>
              </button>
            </>
          )}

          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      {/* RE-DIRECCIÓN AL ARCHIVO EXTERNO */}
      {vistaActual === 'ADMIN_ROLES' ? (
        <AdminRoles arbolCarpetas={arbolCarpetas} onBack={() => setVistaActual('VISOR')} />
      ) : vistaActual === 'ADMIN_USUARIOS' ? (
        <AdminUsuarios onBack={() => setVistaActual('VISOR')} />
      ) : (
        <div style={styles.dashboardLayout}>
          <aside style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Estructura de Módulos</h3>
              <button onClick={cargarDatosDashboard} disabled={cargando} style={styles.miniRefreshBtn}>
                <RefreshCw size={13} />
              </button>
            </div>

            <div style={styles.treeContainer}>
              <div 
                onClick={() => { setCarpetaSeleccionadaId('TODAS'); setCarpetaNombre('Repositorio Global'); }}
                style={carpetaSeleccionadaId === 'TODAS' ? styles.treeNodeActive : styles.treeNode}
              >
                <Folder size={15} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Todos los Reportes</span>
              </div>

              {arbolCarpetas.map((rootNode) => (
                <TreeNode key={rootNode.id} node={rootNode} carpetaSeleccionadaId={carpetaSeleccionadaId} onSelect={handleSelectFolder} />
              ))}
            </div>
          </aside>

          <section style={styles.contentViewer}>
            <div style={styles.tableHeaderControls}>
              <div>
                <h1 style={styles.welcomeTitle}>{carpetaNombre}</h1>
                <p style={styles.welcomeSub}>Mostrando {reportesFiltrados.length} documentos encontrados</p>
              </div>

              <div style={styles.searchContainer}>
                <Search size={16} color="#9ca3af" style={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Buscar en esta sección..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            {error && <div style={styles.errorBanner}>{error}</div>}

            {cargando ? (
              <div style={styles.loadingState}>
                <RefreshCw size={24} style={styles.spinnerAnim} />
                <p>Consultando base de datos indexada...</p>
              </div>
            ) : reportesFiltrados.length === 0 ? (
              <div style={styles.emptyState}>
                <FileText size={40} color="#9ca3af" />
                <p>No se encontraron reportes generados en este nivel del árbol.</p>
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Nombre de Archivo</th>
                      <th style={styles.th}>Ubicación Jerárquica</th>
                      <th style={styles.th}>Tamaño</th>
                      <th style={styles.th}>Generado el</th>
                      <th style={styles.th}>Descarga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportesFiltrados.map((reporte) => (
                      <tr key={reporte.id} style={styles.tr}>
                        <td style={styles.tdFile}>
                          <FileText size={16} color="#059669" style={{ marginRight: 10, flexShrink: 0 }} />
                          <span style={styles.fileNameText}>{reporte.nombre_archivo}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.badge}>{reporte.carpeta}</span>
                        </td>
                        <td style={styles.td}>{formatearTamaño(Number(reporte.tamano_mb))}</td>
                        <td style={styles.tdTime}>
                          {new Date(reporte.fecha_modificacion).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td style={styles.td}>
                          <button onClick={() => descargarArchivo(reporte.id, reporte.nombre_archivo)} style={styles.downloadBtn}>
                            <Download size={14} />
                            <span>Obtener</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { height: '100vh', display: 'flex', flexDirection: 'column' as const, backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '0 24px', height: '60px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  navBrand: { display: 'flex', alignItems: 'center', gap: '12px' },
  navLogo: { height: '32px', objectFit: 'contain' as const },
  divider: { width: '1px', height: '20px', backgroundColor: '#e2e8f0' },
  brandText: { fontSize: '14px', fontWeight: '600', color: '#334155' },
  adminBtn: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  adminActiveBtn: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0284c7', border: '1px solid #0284c7', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  dashboardLayout: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' as const, padding: '16px', flexShrink: 0 },
  sidebarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' },
  sidebarTitle: { fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' as const, margin: 0 },
  miniRefreshBtn: { border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#64748b' },
  treeContainer: { flex: 1, overflowY: 'auto' as const, paddingRight: '4px' },
  treeNode: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', color: '#334155', transition: 'background 0.2s', userSelect: 'none' as const },
  treeNodeActive: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#452b1b', color: '#ffffff', fontWeight: '500' },
  contentViewer: { flex: 1, padding: '24px', overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const },
  tableHeaderControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  welcomeTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 },
  welcomeSub: { fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' },
  searchContainer: { position: 'relative' as const, width: '280px' },
  searchIcon: { position: 'absolute' as const, left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' as const },
  searchInput: { width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' },
  tableContainer: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '12px 20px', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' as const },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 20px', fontSize: '13px', color: '#334155' },
  tdTime: { padding: '12px 20px', fontSize: '12px', color: '#64748b' },
  tdFile: { padding: '12px 20px', fontSize: '13px', display: 'flex', alignItems: 'center' },
  fileNameText: { fontWeight: '500', color: '#1e293b' },
  badge: { backgroundColor: '#f5f5f4', color: '#452b1b', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' },
  downloadBtn: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  errorBanner: { padding: '12px 16px', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' },
  loadingState: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '60px', color: '#64748b' },
  emptyState: { textAlign: 'center' as const, padding: '60px', color: '#64748b', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '8px' },
  spinnerAnim: { animation: 'spin 1s linear infinite', marginBottom: 12 }
};