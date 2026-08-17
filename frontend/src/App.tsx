import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    // Al cargar la app, verificamos si ya inició sesión previamente
    const tokenGuardado = localStorage.getItem('sap_token');
    if (tokenGuardado) {
      setToken(tokenGuardado);
    }
    setVerificando(false);
  }, []);

  if (verificando) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
        Iniciando pasarela de seguridad SAP...
      </div>
    );
  }

  return (
    <>
      {!token ? (
        <Login onLoginSuccess={(nuevoToken) => setToken(nuevoToken)} />
      ) : (
        <Dashboard onLogout={() => setToken(null)} />
      )}
    </>
  );
}