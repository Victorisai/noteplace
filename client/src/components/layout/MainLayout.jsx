import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { getNotesByUsername } from '../../services/noteService';
import UserMenu from './UserMenu';
import { useToastContext } from '../../context/ToastContext';
import styles from './MainLayout.module.css';

function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const [notesCount, setNotesCount] = useState(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(72);
  const headerRef = useRef(null);

  useEffect(() => {
    async function loadCount() {
      if (!user?.username) {
        setNotesCount(0);
        return;
      }

      try {
        const data = await getNotesByUsername(user.username);
        setNotesCount(data.profile?.notes_count || 0);
      } catch {
        setNotesCount(0);
      }
    }

    loadCount();
  }, [user?.username]);

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) return undefined;

    const measureHeader = () => {
      const nextHeight = Math.round(headerElement.getBoundingClientRect().height);
      setHeaderHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    measureHeader();
    window.addEventListener('resize', measureHeader);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.removeEventListener('resize', measureHeader);
      };
    }

    const observer = new ResizeObserver(measureHeader);
    observer.observe(headerElement);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureHeader);
    };
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastDirection = 0;
    let accumulatedDelta = 0;
    let lastTouchY = null;

    const hideThreshold = 28;
    const showThreshold = 12;
    const topSafeZone = 24;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (Math.abs(delta) < 1) {
        return;
      }

      if (currentScrollY <= topSafeZone) {
        setIsHeaderVisible(true);
        accumulatedDelta = 0;
        lastDirection = 0;
        return;
      }

      const direction = delta > 0 ? 1 : -1;

      if (direction !== lastDirection) {
        accumulatedDelta = 0;
        lastDirection = direction;
      }

      accumulatedDelta += Math.abs(delta);

      if (direction === 1 && accumulatedDelta >= hideThreshold) {
        setIsHeaderVisible(false);
        accumulatedDelta = 0;
      }

      if (direction === -1 && accumulatedDelta >= showThreshold) {
        setIsHeaderVisible(true);
        accumulatedDelta = 0;
      }
      lastScrollY = currentScrollY;
    }

    function handleWheel(event) {
      if (event.deltaY < -2) {
        setIsHeaderVisible(true);
      }
    }

    function handleTouchStart(event) {
      lastTouchY = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event) {
      const currentTouchY = event.touches[0]?.clientY;
      if (currentTouchY == null || lastTouchY == null) return;

      if (currentTouchY - lastTouchY > 4) {
        setIsHeaderVisible(true);
      }

      lastTouchY = currentTouchY;
    }

    function handleTouchEnd() {
      lastTouchY = null;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleOpenSettings() {
    showToast('Configuraciones estará disponible pronto', 'info');
  }

  return (
    <div className={styles.app} style={{ '--header-height': `${headerHeight}px` }}>
      <header
        ref={headerRef}
        className={`${styles.header} ${isHeaderVisible ? styles.headerVisible : styles.headerHidden}`}
      >
        <div className={styles.headerInner}>
          <Link to={isAuthenticated ? '/feed' : '/'} className={styles.brand}>
            <Logo />
          </Link>

          <nav className={styles.nav}>
            {!isAuthenticated ? (
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                Inicio
              </NavLink>
            ) : null}

            {isAuthenticated ? (
              <NavLink
                to="/feed"
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                Feed
              </NavLink>
            ) : null}

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/messages"
                  className={({ isActive }) =>
                    isActive ? `${styles.messageLink} ${styles.active}` : styles.messageLink
                  }
                  aria-label="Mensajes"
                  title="Mensajes"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 9.5H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M7 13.5H13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M7 20L4 21V6.5C4 5.12 5.12 4 6.5 4H17.5C18.88 4 20 5.12 20 6.5V15.5C20 16.88 18.88 18 17.5 18H9L7 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </NavLink>

                <UserMenu
                  user={user}
                  notesCount={notesCount}
                  onLogout={handleLogout}
                  onOpenSettings={handleOpenSettings}
                />
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                >
                  Login
                </NavLink>

                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                >
                  Registro
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
