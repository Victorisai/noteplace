import { useToastContext } from '../../context/ToastContext';
import Toast from './Toast';
import styles from './Toast.module.css';

function ToastContainer() {
  const { toasts, removeToast } = useToastContext();

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

export default ToastContainer;