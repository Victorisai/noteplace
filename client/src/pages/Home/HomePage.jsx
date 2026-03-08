import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import styles from './HomePage.module.css';

function HomePage() {
  useDocumentTitle('NotePlace | Comparte tus ideas');

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <span className={styles.badge}>Comparte tus ideas</span>
        <h1 className={styles.title}>Bienvenido a NotePlace</h1>
        <p className={styles.description}>
          Un espacio moderno para publicar notas, pensamientos e ideas en tiempo real.
        </p>

        <div className={styles.actions}>
          <Link to="/register" className={styles.primaryButton}>
            Crear cuenta
          </Link>
          <Link to="/login" className={styles.secondaryButton}>
            Iniciar sesión
          </Link>
        </div>
      </div>

      <div className={styles.preview}>
        <div className={styles.card}>
          <h3>@isai_dev</h3>
          <p>Construyendo en público desde Quintana Roo 🚀</p>
        </div>

        <div className={styles.card}>
          <h3>@noteplace</h3>
          <p>Comparte una idea corta, una reflexión o una actualización rápida.</p>
        </div>
      </div>
    </section>
  );
}

export default HomePage;