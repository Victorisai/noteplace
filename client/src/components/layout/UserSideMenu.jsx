import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { useTheme } from '../../hooks/useTheme';
import styles from './UserSideMenu.module.css';

function UserSideMenu({
  isOpen,
  variant = 'drawer',
  panelRef,
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

    const scrollY = window.scrollY;
    const bodyStyle = document.body.style;
    const htmlStyle = document.documentElement.style;
    const previousBodyStyle = {
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      top: bodyStyle.top,
      left: bodyStyle.left,
      right: bodyStyle.right,
      width: bodyStyle.width,
      touchAction: bodyStyle.touchAction,
    };
    const previousHtmlOverflow = htmlStyle.overflow;

    document.addEventListener('keydown', handleEscape);
    htmlStyle.overflow = 'hidden';
    bodyStyle.overflow = 'hidden';
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.left = '0';
    bodyStyle.right = '0';
    bodyStyle.width = '100%';
    bodyStyle.touchAction = 'none';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      bodyStyle.overflow = previousBodyStyle.overflow;
      bodyStyle.position = previousBodyStyle.position;
      bodyStyle.top = previousBodyStyle.top;
      bodyStyle.left = previousBodyStyle.left;
      bodyStyle.right = previousBodyStyle.right;
      bodyStyle.width = previousBodyStyle.width;
      bodyStyle.touchAction = previousBodyStyle.touchAction;
      htmlStyle.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
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
      ref={panelRef}
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
