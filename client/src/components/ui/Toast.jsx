import styles from './Toast.module.css';

function Toast({ toast, onClose }) {
  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <p className={styles.message}>{toast.message}</p>
      <button className={styles.closeButton} onClick={() => onClose(toast.id)}>
        ×
      </button>
    </div>
  );
}

export default Toast;