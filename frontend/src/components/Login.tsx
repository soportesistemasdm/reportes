import React, { useState } from 'react';
import axios from 'axios';
import logoDelMonte from '../assets/logo-nuevo-01.png';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // 👈 Cambiamos email por usuarioId
  const [usuarioId, setUsuarioId] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // 👈 Enviamos usuarioId al backend
      const response = await axios.post('http://localhost:4000/api/auth/login', {
        usuarioId, 
        password,
      });

      console.log('Respuesta del servidor:', response.data);

      if (response.data.success) {
        const token = response.data.token;
        const rolId = response.data.usuario.rol_id;
        localStorage.setItem('sap_token', token);
        localStorage.setItem('user_role', rolId);
        onLoginSuccess(token);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al conectar con el servidor de autenticación');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logoDelMonte} alt="Del Monte AG" style={styles.logo} />
        
        <h2 style={styles.title}>Sistema de Reportes SAP</h2>
        <p style={styles.subtitle}>Inicia sesión para acceder a tus carpetas permitidas</p>
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            {/* 👈 Modificamos el Label y Placeholder */}
            <label style={styles.label}>ID de Usuario SAP</label>
            <input
              type="text"
              value={usuarioId}
              onChange={(e) => setUsuarioId(e.target.value)}
              placeholder="Ej: USR_JPEREZ o 100452"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={cargando} style={styles.button}>
            {cargando ? 'Autenticando...' : 'Ingresar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' },
  card: { background: '#ffffff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' as const },
  logo: { width: '80%', maxHeight: '65px', objectFit: 'contain' as const, marginBottom: '20px' },
  title: { margin: '0 0 5px 0', color: '#1f2937', fontSize: '22px', fontWeight: 'bold' },
  subtitle: { margin: '0 0 25px 0', color: '#6b7280', fontSize: '13px' },
  form: { textAlign: 'left' as const },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '6px', color: '#374151', fontSize: '14px', fontWeight: '500' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' as const },
  button: { width: '100%', padding: '12px', background: '#452b1b', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
  error: { padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' as const }
};