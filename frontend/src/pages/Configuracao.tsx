import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const Configuracao = () => {
  const navigate = useNavigate();
  const { isDark, isAnonimo, userData, toggleTheme, toggleAnonimo, updateUserData } = useConfig();

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPasswordConfirm, setCurrentPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFoto, setSelectedFoto] = useState((userData as any)?.foto || '👤');

  if (!userData) {
    return (
      <div style={{ color: '#FFF', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000' }}>
        Usuário não logado. Redirecionando...
      </div>
    );
  }

  const theme = {
    bg: isDark ? 'radial-gradient(circle at 50% 10%, #1a0b2e 0%, #090612 100%)' : 'radial-gradient(circle at 50% 10%, #f3e8ff 0%, #f8fafc 100%)',
    text: isDark ? '#f8fafc' : '#1e293b',
    cardBkg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    accent: '#9333ea',
    cyan: '#38bdf8',
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

const handleSaveAvatar = async (novaFoto: string) => {
    try {
      setSelectedFoto(novaFoto);
      await updateUserData({
        ...userData,
        foto: novaFoto
      } as any);
      setIsEditingAvatar(false);
      alert('Foto de perfil atualizada com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar foto de perfil.');
    }
  };

  // Conversor de imagem local para Base64 (caso queira enviar foto própria)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleSaveAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const avataresPreDefinidos = ['🥷', '🤖', '🦊', '⚡', '💀', '🔥', '👾', '👑'];

  const styles = {
    screen: {
      width: '100vw', 
      minHeight: '100vh', 
      background: theme.bg, 
      color: theme.text,
      display: 'flex', 
      flexDirection: 'column' as const, 
      alignItems: 'center',
      padding: '0 20px 40px 20px', 
      fontFamily: "'Courier New', monospace, sans-serif", 
      boxSizing: 'border-box' as const,
    },
    header: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 100,
      width: '100%',
      maxWidth: '700px',
      backgroundColor: isDark ? 'rgba(9, 6, 18, 0.9)' : 'rgba(248, 250, 252, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
      padding: '15px 10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      boxSizing: 'border-box' as const,
    },
    profileBox: {
      width: '100%', 
      maxWidth: '700px', 
      padding: '30px', 
      background: theme.cardBkg,
      backdropFilter: 'blur(12px)',
      borderRadius: '20px', 
      border: `1px solid ${theme.borderColor}`, 
      boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
      boxSizing: 'border-box' as const,
    },
    row: {
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '16px 0', 
      borderBottom: `1px solid ${theme.borderColor}`,
      fontSize: '0.95rem'
    },
    overlay: {
      position: 'fixed' as const, top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
      background: isDark ? '#0f172a' : '#ffffff', 
      padding: '30px', 
      borderRadius: '20px', 
      border: `1px solid ${theme.accent}`,
      display: 'flex', 
      flexDirection: 'column' as const, 
      gap: '20px', 
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
      boxSizing: 'border-box' as const,
    },
    input: { 
      padding: '12px', 
      borderRadius: '8px', 
      border: `1px solid ${theme.borderColor}`, 
      background: isDark ? '#1e293b' : '#f8fafc', 
      color: theme.text,
      outline: 'none',
      fontFamily: 'inherit'
    },
    actionBtn: { padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' as const, color: '#fff' }
  };

  return (
    <div style={styles.screen}>
      {/* CABEÇALHO FIXO COM BOTÃO VOLTAR */}
      <div style={styles.header}>
        <button 
          onClick={() => navigate('/home')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            color: '#22c55e',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#22c55e';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#22c55e';
          }}
        >
          ← MENU
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', letterSpacing: '2px', color: theme.cyan, textTransform: 'uppercase' }}>
            PONG COM AR
          </span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: theme.accent, margin: 0, letterSpacing: '1px' }}>
            PERFIL DE USUÁRIO
          </h2>
        </div>

        <div style={{ width: '65px' }} />
      </div>

      <div style={styles.profileBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', borderBottom: `1px solid ${theme.borderColor}`, paddingBottom: '20px' }}>
          <div style={{ 
            width: '75px', height: '75px', borderRadius: '50%', background: 'rgba(147, 51, 234, 0.1)', 
            border: `2px solid ${theme.accent}`, display: 'flex', justifyContent: 'center', alignItems: 'center', 
            fontSize: '2rem', overflow: 'hidden' 
          }}>
            {selectedFoto.startsWith('data:image') ? (
              <img src={selectedFoto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              selectedFoto
            )}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{isAnonimo ? "ANÔNIMO" : userData.usuario}</div>
            <button 
              onClick={() => setIsEditingAvatar(true)}
              style={{ background: 'none', border: 'none', color: theme.cyan, cursor: 'pointer', fontWeight: 'bold', padding: 0, marginTop: '5px', fontSize: '0.85rem' }}
            >
              ALTERAR FOTO DE PERFIL
            </button>
          </div>
        </div>

        <div style={styles.row}>
          <span style={{ color: '#94a3b8' }}>SEU ID:</span> 
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            #{String(userData.id).padStart(8, '0')}
          </span>
        </div>
        
        <div style={styles.row}>
          <span style={{ color: '#94a3b8' }}>SEU USUÁRIO:</span> 
          <span style={{ fontWeight: 'bold' }}>
            {isAnonimo ? "ANÔNIMO" : userData.usuario}
          </span>
        </div>

        <div style={styles.row}>
          <span style={{ color: '#94a3b8' }}>EMAIL:</span> 
          <span>{userData.email}</span>
        </div>
        
        <div style={styles.row}>
          <span style={{ color: '#94a3b8' }}>SENHA:</span> 
          <span style={{ color: theme.cyan, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsEditingPassword(true)}>
            •••••••• (ALTERAR)
          </span>
        </div>

        <div style={styles.row}>
          <span style={{ color: '#94a3b8' }}>ATIVAR MODO ANÔNIMO:</span>
          <div style={{ display: 'flex', gap: '15px', fontWeight: 'bold' }}>
             <label style={{ cursor: 'pointer' }}><input type="radio" checked={!isAnonimo} onChange={toggleAnonimo} /> NÃO</label>
             <label style={{ cursor: 'pointer' }}><input type="radio" checked={isAnonimo} onChange={toggleAnonimo} /> SIM</label>
          </div>
        </div>

        <div style={{ ...styles.row, borderBottom: 'none', justifyContent: 'center', paddingTop: '20px' }}>
          <button onClick={toggleTheme} style={{ padding: '10px 25px', borderRadius: '12px', cursor: 'pointer', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', color: theme.text, border: 'none', fontWeight: 'bold' }}>
            {isDark ? '🌙 MODO ESCURO' : '☀️ MODO CLARO'}
          </button>
        </div>
      </div>

      {/* MODAL DE ESCOLHA DE FOTO / AVATAR */}
      {isEditingAvatar && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ color: theme.accent, textAlign: 'center', margin: 0 }}>ESCOLHER AVATAR</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', textAlign: 'center' }}>
              {avataresPreDefinidos.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleSaveAvatar(emoji)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '1.8rem',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: '0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>ou envie uma imagem do dispositivo:</div>
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ fontSize: '0.85rem', color: theme.text }} />

            <button 
              onClick={() => setIsEditingAvatar(false)} 
              style={{ ...styles.actionBtn, backgroundColor: '#334155', marginTop: '10px' }}
            >
              CANCELAR
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ALTERAR SENHA */}
      {isEditingPassword && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ color: theme.accent, textAlign: 'center', margin: 0 }}>ALTERAR SENHA</h3>
            <input type={showPassword ? "text" : "password"} placeholder="Senha atual" value={currentPasswordConfirm} onChange={(e) => setCurrentPasswordConfirm(e.target.value)} style={styles.input} />
            <input type={showPassword ? "text" : "password"} placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} />
            <label style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <input type="checkbox" onChange={() => setShowPassword(!showPassword)} /> Exibir senhas
            </label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleSavePassword} style={{ ...styles.actionBtn, flex: 1, backgroundColor: theme.green }}>SALVAR</button>
              <button onClick={() => setIsEditingPassword(false)} style={{ ...styles.actionBtn, flex: 1, backgroundColor: theme.red }}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracao;