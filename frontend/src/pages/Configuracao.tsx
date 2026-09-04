import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Configuracao = () => {
  const navigate = useNavigate();
  const { isDark, isAnonimo, userData, toggleTheme, toggleAnonimo, updateUserData } = useConfig();

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPasswordConfirm, setCurrentPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Proteção: Se não houver usuário, redireciona ou avisa
  if (!userData) {
    return (
      <div style={{ color: '#FFF', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000' }}>
        Usuário não logado. Redirecionando...
      </div>
    );
  }

  const theme = {
    bg: isDark ? '#000' : '#F5F5F5',
    text: isDark ? '#FFF' : '#222',
    cardBkg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFF',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#DDD',
    accent: '#9333ea',
    cyan: '#00ffff',
    green: '#22c55e',
    red: '#ef4444',
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      await updateUserData({
        ...userData,
        currentPassword: currentPasswordConfirm,
        senha: newPassword 
      });
      
      alert('Senha alterada com sucesso!');
      setNewPassword('');
      setCurrentPasswordConfirm('');
      setIsEditingPassword(false);
    } catch (err) {
      alert('Erro: Senha atual incorreta ou erro de servidor.');
    }
  };

  const styles = {
    screen: {
      width: '100vw', minHeight: '100vh', backgroundColor: theme.bg, color: theme.text,
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      justifyContent: 'center', fontFamily: '"Segoe UI", sans-serif', transition: '0.3s all ease', padding: '20px 0',
    },
    profileBox: {
      width: '90%', maxWidth: '700px', padding: '30px', background: theme.cardBkg,
      borderRadius: '20px', border: `1px solid ${theme.borderColor}`, boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.1)',
    },
    row: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${theme.borderColor}`,
    },
    backBtn: {
      marginTop: '30px', background: 'linear-gradient(to right, #166534, #22c55e)', color: '#fff',
      border: 'none', padding: '15px 40px', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' as const, fontSize: '1.1rem',
    },
    overlay: {
      position: 'fixed' as const, top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
      background: theme.bg, padding: '30px', borderRadius: '20px', border: `2px solid ${theme.accent}`,
      display: 'flex', flexDirection: 'column' as const, gap: '15px', width: '300px',
    },
    input: { padding: '12px', borderRadius: '8px', border: `1px solid ${theme.borderColor}`, background: theme.cardBkg, color: theme.text },
    actionBtn: { padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' as const, color: '#fff' }
  };

  return (
    <div style={styles.screen}>
      <h1 style={{ color: '#87CEEB', fontStyle: 'italic', margin: 0 }}>PONG COM AR</h1>
      <h2 style={{ color: theme.accent, WebkitTextStroke: `1px ${theme.cyan}`, fontSize: '3.5rem', margin: '10px 0 30px 0' }}>PERFIL USUÁRIO</h2>

      <div style={styles.profileBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: `3px solid ${theme.text}`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>👤</div>
          <button style={{ background: 'none', border: 'none', color: theme.cyan, cursor: 'pointer', fontWeight: 'bold' }}>ALTERAR FOTO DE PERFIL</button>
        </div>

        <div style={styles.row}>
          <span>SEU ID:</span> 
          <span style={{ opacity: 0.8 }}>
            {String(userData.id).padStart(8, '0')}
          </span>
        </div>
        <div style={styles.row}>
          <span>SEU USUÁRIO:</span> 
          <span style={{ opacity: 0.8 }}>
            {isAnonimo ? "ANÔNIMO" : userData.usuario}
          </span>
        </div>
        <div style={styles.row}><span>EMAIL:</span> <span style={{ opacity: 0.8 }}>{userData.email}</span></div>
        
        <div style={styles.row}>
          <span>SENHA:</span> 
          <span style={{ opacity: 0.8, color: theme.cyan, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsEditingPassword(true)}>
            •••••••• (ALTERAR)
          </span>
        </div>

        <div style={styles.row}>
          <span>ATIVAR MODO ANÔNIMO:</span>
          <div style={{ display: 'flex', gap: '10px' }}>
             <label><input type="radio" checked={!isAnonimo} onChange={toggleAnonimo} /> NÃO</label>
             <label><input type="radio" checked={isAnonimo} onChange={toggleAnonimo} /> SIM</label>
          </div>
        </div>

        <div style={{ ...styles.row, borderBottom: 'none', justifyContent: 'center', marginTop: '10px' }}>
          <button onClick={toggleTheme} style={{ padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', backgroundColor: isDark ? '#333' : '#DDD', color: theme.text, border: 'none' }}>
            {isDark ? '🌙 MODO ESCURO' : '☀️ MODO CLARO'}
          </button>
        </div>
      </div>

      {isEditingPassword && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={{ color: theme.accent, textAlign: 'center' }}>ALTERAR SENHA</h2>
            <input type={showPassword ? "text" : "password"} placeholder="Senha atual" value={currentPasswordConfirm} onChange={(e) => setCurrentPasswordConfirm(e.target.value)} style={styles.input} />
            <input type={showPassword ? "text" : "password"} placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} />
            <label style={{ fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" onChange={() => setShowPassword(!showPassword)} /> Exibir senhas
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSavePassword} style={{ ...styles.actionBtn, flex: 1, backgroundColor: theme.green }}>SALVAR</button>
              <button onClick={() => setIsEditingPassword(false)} style={{ ...styles.actionBtn, flex: 1, backgroundColor: theme.red }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      <button style={styles.backBtn} onClick={() => navigate('/home')}>VOLTAR PÁGINA INICIAL ➔</button>
    </div>
  );
};

export default Configuracao;