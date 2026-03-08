import styles from './PageLoader.module.css';

function PageLoader({ text = 'Cargando...' }) {
  return (
    <div className={styles.loaderWrap}>
      <div className={styles.spinner}></div>
      <p>{text}</p>
    </div>
  );
}

export default PageLoader;