import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import styles from './FollowListModal.module.css';

function FollowListModal({
  isOpen,
  title,
  users = [],
  loading = false,
  emptyMessage = 'No hay usuarios para mostrar.',
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <section className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <h3>{title}</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>Cerrar</button>
        </header>

        {loading ? <p className={styles.state}>Cargando...</p> : null}
        {!loading && !users.length ? <p className={styles.state}>{emptyMessage}</p> : null}

        {!loading && users.length ? (
          <ul className={styles.list}>
            {users.map((item) => (
              <li key={item.id}>
                <Link to={`/profile/${item.username}`} className={styles.userRow} onClick={onClose}>
                  <Avatar name={item.name} avatarUrl={item.avatar_url} size="sm" />
                  <div className={styles.userInfo}>
                    <p className={styles.name}>{item.name}</p>
                    <p className={styles.username}>@{item.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

export default FollowListModal;
