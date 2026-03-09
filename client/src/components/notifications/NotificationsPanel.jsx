import { useEffect, useState } from 'react';
import useToast from '../../hooks/useToast';
import { getMyNotifications, markNotificationsRead } from '../../services/notificationService';
import styles from './NotificationsPanel.module.css';

function formatDate(dateString) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

function getNotificationText(item) {
  if (item.type === 'follow') return 'comenzó a seguirte';
  if (item.type === 'like') return 'dio like a tu nota';
  if (item.type === 'comment') return 'comentó tu nota';
  return 'realizó una acción';
}

function NotificationsPanel() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadNotifications({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const data = await getMyNotifications();
      setItems(data.notifications || []);
      setUnreadCount(Number(data.unread_count) || 0);
      setError('');
    } catch (err) {
      const message = err.message || 'No se pudieron cargar las notificaciones';
      setError(message);
      if (!silent) showToast(message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await loadNotifications();
      } finally {
        setLoading(false);
      }
    }

    load();
    const intervalId = setInterval(() => {
      loadNotifications({ silent: true });
    }, 20000);

    return () => clearInterval(intervalId);
  }, [showToast]);

  async function handleMarkRead() {
    try {
      setMarkingRead(true);
      await markNotificationsRead();
      setItems([]);
      setUnreadCount(0);
      setError('');
    } catch (err) {
      const message = err.message || 'No se pudieron marcar como leídas';
      setError(message);
      showToast(message, 'error');
    } finally {
      setMarkingRead(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await loadNotifications({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <p className={styles.state}>Cargando notificaciones...</p>;

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Notificaciones</h3>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button
            type="button"
            className={styles.readButton}
            onClick={handleMarkRead}
            disabled={markingRead || unreadCount === 0}
          >
            {markingRead ? 'Marcando...' : 'Marcar leídas'}
          </button>
        </div>
      </div>
      <p className={styles.unread}>
        {unreadCount} sin leer
      </p>
      {error ? <p className={styles.error}>{error}</p> : null}
      {!items.length ? <p className={styles.state}>No tienes notificaciones.</p> : null}
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={`${styles.item} ${item.is_read ? styles.read : ''}`}>
            <p className={styles.message}>
              <strong>@{item.actor?.username || item.actor_username || 'usuario'}</strong> {getNotificationText(item)}
            </p>
            <p className={styles.date}>{formatDate(item.created_at)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default NotificationsPanel;
