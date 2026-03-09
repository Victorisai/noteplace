import { useEffect, useState } from 'react';
import { getMyNotifications, markNotificationsRead } from '../../services/notificationService';
import styles from './NotificationsPanel.module.css';

function NotificationsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyNotifications();
        setItems(data.notifications || []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function handleMarkRead() {
    await markNotificationsRead();
    setItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
  }

  if (loading) return <p className={styles.state}>Cargando notificaciones...</p>;

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3>Notificaciones</h3>
        <button onClick={handleMarkRead}>Marcar leídas</button>
      </div>
      {!items.length ? <p className={styles.state}>No tienes notificaciones.</p> : null}
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={`${styles.item} ${item.is_read ? styles.read : ''}`}>
            @{item.actor.username}{' '}
            {item.type === 'follow' ? 'comenzó a seguirte' : item.type === 'like' ? 'dio like a tu nota' : 'comentó tu nota'}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default NotificationsPanel;
