import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import styles from './NotFoundPage.module.css';

function NotFoundPage() {
  useDocumentTitle('404 | NotePlace');

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <h1>Página no encontrada</h1>
        <p className={styles.text}>
          La ruta que intentaste abrir no existe o fue movida.
        </p>
        <Link to="/" className={styles.button}>
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;