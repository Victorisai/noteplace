import NotificationsPanel from '../../components/notifications/NotificationsPanel';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import styles from './NotificationsPage.module.css';

function NotificationsPage() {
  useDocumentTitle('Notificaciones | NotePlace');

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Notificaciones</h1>
        <p className={styles.subtitle}>Mantente al día con la actividad de tu cuenta.</p>
      </header>

      <div className={styles.panelWrap}>
        <NotificationsPanel />
      </div>
    </section>
  );
}

export default NotificationsPage;
