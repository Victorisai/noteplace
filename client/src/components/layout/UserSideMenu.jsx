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
  const currentThemeLabel = theme === 'dark' ? 'Oscuro' : 'Claro';
  const nextThemeDescription = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  useEffect(() => {
    if (!isOpen || isDesktopVariant) return undefined;

    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleEscape);
    const shouldLockBackgroundScroll = window.matchMedia('(max-width: 640px)').matches;
    const scrollY = shouldLockBackgroundScroll ? window.scrollY : 0;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyLeft = document.body.style.left;
    const previousBodyRight = document.body.style.right;
    const previousBodyWidth = document.body.style.width;

    if (shouldLockBackgroundScroll) {
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);

      if (shouldLockBackgroundScroll) {
        document.documentElement.style.overflow = previousHtmlOverflow;
        document.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
        document.body.style.overflow = previousBodyOverflow;
        document.body.style.position = previousBodyPosition;
        document.body.style.top = previousBodyTop;
        document.body.style.left = previousBodyLeft;
        document.body.style.right = previousBodyRight;
        document.body.style.width = previousBodyWidth;
        window.scrollTo(0, scrollY);
      }
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
        <div className={styles.headerMeta}>
          <p>Mi cuenta</p>
          <small>Accesos rápidos y preferencias</small>
        </div>

        {!isDesktopVariant ? (
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar menú">
            <span></span>
            <span></span>
          </button>
        ) : null}
      </header>

      <Link to={`/profile/${user.username}`} className={styles.profileCard} role="menuitem" onClick={onClose}>
        <Avatar name={user.name || user.username} avatarUrl={user.avatar_url} size="sm" />

        <div className={styles.profileMeta}>
          <strong>{user.name || user.username}</strong>
          <span>
            @{user.username} · {notesCount} {notesCount === 1 ? 'nota' : 'notas'}
          </span>
        </div>

        <span className={styles.profileHint}>Ver perfil</span>
      </Link>

      <div className={styles.actions}>
        <p className={styles.sectionTitle}>Acciones rápidas</p>

        <Link to="/search" className={styles.menuAction} onClick={onClose} role="menuitem">
          <span className={styles.actionIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M15.3 15.3L19 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>

          <span className={styles.actionBody}>
            <strong>Buscar</strong>
            <small>Perfiles y notas</small>
          </span>

          <span className={styles.actionHint} aria-hidden="true">›</span>
        </Link>

        <button type="button" className={styles.menuAction} onClick={handleSettingsClick} role="menuitem">
          <span className={styles.actionIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 8.75A3.25 3.25 0 1 0 12 15.25A3.25 3.25 0 1 0 12 8.75Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M19.2 13.2V10.8L16.95 10.23C16.82 9.87 16.66 9.53 16.46 9.23L17.67 7.22L15.98 5.53L13.97 6.74C13.67 6.54 13.33 6.38 12.97 6.25L12.4 4H10L9.43 6.25C9.07 6.38 8.73 6.54 8.43 6.74L6.42 5.53L4.73 7.22L5.94 9.23C5.74 9.53 5.58 9.87 5.45 10.23L3.2 10.8V13.2L5.45 13.77C5.58 14.13 5.74 14.47 5.94 14.77L4.73 16.78L6.42 18.47L8.43 17.26C8.73 17.46 9.07 17.62 9.43 17.75L10 20H12.4L12.97 17.75C13.33 17.62 13.67 17.46 13.97 17.26L15.98 18.47L17.67 16.78L16.46 14.77C16.66 14.47 16.82 14.13 16.95 13.77L19.2 13.2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className={styles.actionBody}>
            <strong>Configuraciones</strong>
            <small>Próximamente</small>
          </span>

          <span className={styles.actionHint} aria-hidden="true">›</span>
        </button>

        <button
          type="button"
          className={`${styles.menuAction} ${styles.themeAction}`}
          onClick={handleThemeClick}
          role="menuitem"
        >
          <span className={styles.actionIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 4.75V6.5M12 17.5V19.25M6.17 6.17L7.41 7.41M16.59 16.59L17.83 17.83M4.75 12H6.5M17.5 12H19.25M6.17 17.83L7.41 16.59M16.59 7.41L17.83 6.17"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>

          <span className={styles.actionBody}>
            <strong>Cambiar tema</strong>
            <small>{nextThemeDescription}</small>
          </span>

          <span className={styles.themeState}>{currentThemeLabel}</span>
        </button>
      </div>

      <div className={styles.footerActions}>
        <button
          type="button"
          className={`${styles.menuAction} ${styles.menuDanger}`}
          onClick={handleLogoutClick}
          role="menuitem"
        >
          <span className={styles.actionIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M10 6.25H6.75A1.75 1.75 0 0 0 5 8V16A1.75 1.75 0 0 0 6.75 17.75H10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M13 15.75L17 12L13 8.25"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9 12H17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>

          <span className={styles.actionBody}>
            <strong>Cerrar sesión</strong>
            <small>Finaliza tu sesión actual</small>
          </span>

          <span className={styles.actionHint} aria-hidden="true">›</span>
        </button>
      </div>
    </aside>
  );
}

export default UserSideMenu;
