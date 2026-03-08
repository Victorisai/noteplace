import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import CommentComposer from './CommentComposer';
import CommentsList from './CommentsList';
import { createComment, getComments, toggleLike, updateNote } from '../../services/noteService';
import useToast from '../../hooks/useToast';
import styles from './NoteCard.module.css';

function formatDate(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function NoteCard({ note, onDelete, onUpdate, deleting }) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const isOwner = user?.id === note.user?.id;

  const [liked, setLiked] = useState(note.is_liked);
  const [likesCount, setLikesCount] = useState(note.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(note.comments_count || 0);

  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState([]);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(note.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    setLiked(note.is_liked);
    setLikesCount(note.likes_count || 0);
    setCommentsCount(note.comments_count || 0);
    setEditValue(note.content);
  }, [note]);

  async function handleToggleLike() {
    if (!isAuthenticated) {
      showToast('Debes iniciar sesión para dar like', 'error');
      return;
    }

    try {
      const data = await toggleLike(note.id);
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleToggleComments() {
    const nextValue = !showComments;
    setShowComments(nextValue);

    if (nextValue && comments.length === 0) {
      try {
        setCommentsLoading(true);
        const data = await getComments(note.id);
        setComments(data.comments);
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        setCommentsLoading(false);
      }
    }
  }

  async function handleCreateComment(content) {
    try {
      setSendingComment(true);
      const data = await createComment(note.id, { content });
      setComments((prev) => [...prev, data.comment]);
      setCommentsCount((prev) => prev + 1);
      setShowComments(true);
      showToast('Respuesta publicada', 'success');
      return true;
    } catch (error) {
      showToast(error.message, 'error');
      return false;
    } finally {
      setSendingComment(false);
    }
  }

  async function handleSaveEdit() {
    try {
      setSavingEdit(true);
      const data = await updateNote(note.id, { content: editValue });
      onUpdate(data.note);
      setEditing(false);
      showToast('Nota actualizada correctamente', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.userBlock}>
          <Avatar
            name={note.user?.name}
            avatarUrl={note.user?.avatar_url}
            size="md"
          />

          <div>
            <p className={styles.name}>{note.user?.name}</p>
            <Link to={`/profile/${note.user?.username}`} className={styles.username}>
              @{note.user?.username}
            </Link>
          </div>
        </div>

        {isOwner ? (
          <div className={styles.ownerActions}>
            <button
              className={styles.secondaryButton}
              onClick={() => setEditing((prev) => !prev)}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>

            <button
              className={styles.deleteButton}
              onClick={() => onDelete(note.id)}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <div className={styles.editWrap}>
          <textarea
            className={styles.editTextarea}
            value={editValue}
            maxLength={280}
            onChange={(event) => setEditValue(event.target.value)}
          />

          <div className={styles.editFooter}>
            <span>{280 - editValue.length} restantes</span>
            <button
              className={styles.saveButton}
              onClick={handleSaveEdit}
              disabled={savingEdit || !editValue.trim()}
            >
              {savingEdit ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      ) : (
        <p className={styles.content}>{note.content}</p>
      )}

      <div className={styles.meta}>
        <span>{formatDate(note.created_at)}</span>
        {note.updated_at && note.updated_at !== note.created_at ? (
          <span>Editada</span>
        ) : null}
      </div>

      <div className={styles.interactions}>
        <button
          type="button"
          className={`${styles.interactionButton} ${liked ? styles.liked : ''}`}
          onClick={handleToggleLike}
        >
          ❤️ {likesCount}
        </button>

        <button
          type="button"
          className={styles.interactionButton}
          onClick={handleToggleComments}
        >
          💬 {commentsCount}
        </button>
      </div>

      {showComments ? (
        <div className={styles.commentsSection}>
          {commentsLoading ? <p className={styles.commentsState}>Cargando respuestas...</p> : null}
          {!commentsLoading ? <CommentsList comments={comments} /> : null}

          {isAuthenticated ? (
            <CommentComposer
              onSubmit={handleCreateComment}
              loading={sendingComment}
            />
          ) : (
            <p className={styles.commentsState}>
              Inicia sesión para responder.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}

export default NoteCard;