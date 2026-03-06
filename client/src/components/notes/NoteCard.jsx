import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './NoteCard.module.css';

function formatDate(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function NoteCard({ note, onDelete, deleting }) {
  const { user } = useAuth();

  const isOwner = user?.id === note.user?.id;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.userBlock}>
          <div className={styles.avatar}>
            {note.user?.name?.charAt(0)?.toUpperCase() || 'N'}
          </div>

          <div>
            <p className={styles.name}>{note.user?.name}</p>
            <Link to={`/profile/${note.user?.username}`} className={styles.username}>
              @{note.user?.username}
            </Link>
          </div>
        </div>

        {isOwner ? (
          <button
            className={styles.deleteButton}
            onClick={() => onDelete(note.id)}
            disabled={deleting}
          >
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        ) : null}
      </div>

      <p className={styles.content}>{note.content}</p>

      <div className={styles.meta}>
        <span>{formatDate(note.created_at)}</span>
      </div>
    </article>
  );
}

export default NoteCard;