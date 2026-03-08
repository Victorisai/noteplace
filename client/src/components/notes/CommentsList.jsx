import Avatar from '../ui/Avatar';
import styles from './CommentsList.module.css';

function formatDate(dateString) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

function CommentsList({ comments }) {
  if (!comments.length) {
    return <p className={styles.empty}>Aún no hay respuestas.</p>;
  }

  return (
    <div className={styles.list}>
      {comments.map((comment) => (
        <div key={comment.id} className={styles.item}>
          <Avatar
            name={comment.user?.name}
            avatarUrl={comment.user?.avatar_url}
            size="sm"
          />

          <div className={styles.body}>
            <div className={styles.meta}>
              <strong>{comment.user?.name}</strong>
              <span>@{comment.user?.username}</span>
              <span>{formatDate(comment.created_at)}</span>
            </div>

            <p className={styles.content}>{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CommentsList;