import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { useTheme } from '../../hooks/useTheme';
import styles from './UserSideMenu.module.css';

function UserSideMenu({
  isOpen,
  variant = 'drawer',
  user,
  notesCount = 0,
  onClose,
  onLogout,
  onOpenSettings,
}) {
  const { theme, toggleTheme } = useTheme();
  const isDesktopVariant = variant === 'desktop';

  useEffect(() => {
    if (!isOpen || isDesktopVariant) return undefined;

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isDesktopVariant, isOpen, onClose]);

  if (!isOpen || !user) return null;

  function handleSettingsClick() {
    onOpenSettings?.();
    onClose?.();
  }

  function handleThemeClick() {
    toggleTheme();
  }

  function handleLogoutClick() {
    onLogout?.();
    onClose?.();
  }

  return (
    <aside
      id="user-side-menu"
      className={`${styles.panel} ${isDesktopVariant ? styles.panelDesktop : ''}`}
      role="menu"
      aria-label="Menú de usuario"
    >
      <header className={styles.panelHeader}>
        <p>Mi cuenta</p>
        {!isDesktopVariant ? (
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar menú">
            <span></span>
            <span></span>
          </button>
        ) : null}
      </header>

      <Link
        to={`/profile/${user.username}`}
        className={styles.profileCard}
        role="menuitem"
        onClick={onClose}
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

      <div className={styles.actions}>
        <Link to="/search" className={styles.menuAction} onClick={onClose} role="menuitem">
          <span>Buscar</span>
          <small>Perfiles y notas</small>
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
    </aside>
  );
}

export default UserSideMenu;
