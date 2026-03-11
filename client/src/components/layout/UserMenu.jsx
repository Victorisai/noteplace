import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { useTheme } from '../../hooks/useTheme';
import styles from './UserMenu.module.css';

function UserMenu({ user, notesCount = 0, onLogout, onOpenSettings }) {
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  function handleSettingsClick() {
    onOpenSettings?.();
    setIsOpen(false);
  }

  function handleThemeClick() {
    toggleTheme();
  }

  function handleLogoutClick() {
    onLogout?.();
    setIsOpen(false);
  }

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Abrir menú de usuario"
      >
        <span className={styles.line}></span>
        <span className={styles.line}></span>
        <span className={styles.line}></span>
      </button>

      {isOpen ? (
        <div className={styles.dropdown} role="menu" aria-label="Menú de usuario">
          <Link
            to={`/profile/${user.username}`}
            className={styles.profileCard}
            role="menuitem"
            onClick={() => setIsOpen(false)}
          >
            <Avatar
              name={user.name || user.username}
              avatarUrl={user.avatar_url}
              size="sm"
            />

            <div className={styles.profileMeta}>
              <strong>{user.name || user.username}</strong>
              <span>
                @{user.username} · {notesCount} {notesCount === 1 ? 'nota' : 'notas'}
              </span>
            </div>
          </Link>

          <button type="button" className={styles.menuAction} onClick={handleSettingsClick} role="menuitem">
            <span>Configuraciones</span>
            <small>Próximamente</small>
          </button>

          <button type="button" className={styles.menuAction} onClick={handleThemeClick} role="menuitem">
            <span>Cambiar tema</span>
            <small>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</small>
          </button>

          <button
            type="button"
            className={`${styles.menuAction} ${styles.menuDanger}`}
            onClick={handleLogoutClick}
            role="menuitem"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default UserMenu;
