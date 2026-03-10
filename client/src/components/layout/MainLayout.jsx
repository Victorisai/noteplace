import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { getNotesByUsername } from '../../services/noteService';
import SearchPanel from '../common/SearchPanel';
import styles from './MainLayout.module.css';

function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [notesCount, setNotesCount] = useState(0);

  useEffect(() => {
    async function loadCount() {
      if (!user?.username) {
        setNotesCount(0);
        return;
      }

      try {
        const data = await getNotesByUsername(user.username);
        setNotesCount(data.profile?.notes_count || 0);
      } catch (error) {
        setNotesCount(0);
      }
    }

    loadCount();
  }, [user?.username]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={isAuthenticated ? '/feed' : '/'} className={styles.brand}>
            <Logo />
          </Link>

          {isAuthenticated ? (
            <div className={styles.searchDesktop}>
              <SearchPanel />
            </div>
          ) : null}

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

                <NavLink
                  to={`/profile/${user.username}`}
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                >
                  @{user.username} ({notesCount})
                </NavLink>

                <button className={styles.logoutButton} onClick={handleLogout}>
                  Salir
                </button>
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
