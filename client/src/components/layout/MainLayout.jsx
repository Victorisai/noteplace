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
          <Link to="/" className={styles.brand}>
            <Logo />
          </Link>

          <div className={styles.searchDesktop}>
            <SearchPanel />
          </div>

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
