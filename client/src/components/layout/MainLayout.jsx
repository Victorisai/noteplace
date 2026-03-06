import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import styles from './MainLayout.module.css';

function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

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

          <nav className={styles.nav}>
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Inicio
            </NavLink>

            <NavLink
              to="/feed"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Feed
            </NavLink>

            {isAuthenticated ? (
              <>
                <NavLink
                  to={`/profile/${user.username}`}
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                >
                  @{user.username}
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