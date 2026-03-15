import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toAbsoluteAssetUrl } from '../../services/api';
import Avatar from '../ui/Avatar';
import CommentComposer from './CommentComposer';
import CommentsList from './CommentsList';
import { createComment, getComments, toggleBookmark, toggleLike, updateNote } from '../../services/noteService';
import useToast from '../../hooks/useToast';
import styles from './NoteCard.module.css';

function formatDate(dateString) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
}

function NoteCard({ note, onDelete, onUpdate, deleting }) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const isOwner = user?.id === note.user?.id;

  const [liked, setLiked] = useState(note.is_liked);
  const [bookmarked, setBookmarked] = useState(note.is_bookmarked);
  const [likesCount, setLikesCount] = useState(note.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(note.comments_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(note.content);
  const [savingEdit, setSavingEdit] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const ownerMenuRef = useRef(null);
  const scrollLockRef = useRef({ y: 0, overflow: '', position: '', top: '', width: '', touchAction: '' });
  const imageCount = note.images?.length || 0;

  useEffect(() => {
    setLiked(note.is_liked);
    setBookmarked(note.is_bookmarked);
    setLikesCount(note.likes_count || 0);
    setCommentsCount(note.comments_count || 0);
    setEditValue(note.content);
    setOwnerMenuOpen(false);
    setViewerOpen(false);
    setViewerIndex(0);
  }, [note]);

  useEffect(() => {
    if (!ownerMenuOpen) return undefined;

    function handleOutsideClick(event) {
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(event.target)) {
        setOwnerMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [ownerMenuOpen]);

  useEffect(() => {
    if (!viewerOpen) return undefined;

    const body = document.body;
    const scrollY = window.scrollY;
    scrollLockRef.current = {
      y: scrollY,
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      touchAction: body.style.touchAction,
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.touchAction = 'none';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setViewerOpen(false);
      }
      if (imageCount > 1 && event.key === 'ArrowLeft') {
        setViewerIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
      }
      if (imageCount > 1 && event.key === 'ArrowRight') {
        setViewerIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      body.style.overflow = scrollLockRef.current.overflow;
      body.style.position = scrollLockRef.current.position;
      body.style.top = scrollLockRef.current.top;
      body.style.width = scrollLockRef.current.width;
      body.style.touchAction = scrollLockRef.current.touchAction;
      window.scrollTo(0, scrollLockRef.current.y);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewerOpen, imageCount]);

  function handleOpenViewer(index) {
    setViewerIndex(index);
    setViewerOpen(true);
  }

  function handleCloseViewer() {
    setViewerOpen(false);
  }

  function handlePrevImage() {
    setViewerIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  }

  function handleNextImage() {
    setViewerIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  }

  async function handleToggleLike() {
    if (!isAuthenticated) return showToast('Debes iniciar sesión para dar like', 'error');
    try {
      const data = await toggleLike(note.id);
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleToggleBookmark() {
    if (!isAuthenticated) return showToast('Debes iniciar sesión para guardar favoritos', 'error');
    try {
      const data = await toggleBookmark(note.id);
      setBookmarked(data.bookmarked);
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
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSavingEdit(false);
    }
  }

  function handleToggleEditing() {
    setEditing((prev) => !prev);
    setOwnerMenuOpen(false);
  }

  function handleDeleteNote() {
    onDelete(note.id);
    setOwnerMenuOpen(false);
  }

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.userBlock}>
          <Avatar name={note.user?.name} avatarUrl={toAbsoluteAssetUrl(note.user?.avatar_url)} size="md" />
          <div>
            <p className={styles.name}>{note.user?.name}</p>
            <Link to={`/profile/${note.user?.username}`} className={styles.username}>@{note.user?.username}</Link>
          </div>
        </div>

        {isOwner ? (
          <div className={styles.ownerActions} ref={ownerMenuRef}>
            <button
              type="button"
              className={styles.ownerMenuTrigger}
              aria-haspopup="menu"
              aria-expanded={ownerMenuOpen}
              aria-label="Acciones de la nota"
              onClick={() => setOwnerMenuOpen((prev) => !prev)}
            >
              &#x22EF;
            </button>

            {ownerMenuOpen ? (
              <div className={styles.ownerMenu} role="menu" aria-label="Acciones">
                <button type="button" className={styles.ownerMenuItem} role="menuitem" onClick={handleToggleEditing}>
                  {editing ? 'Cancelar edición' : 'Editar nota'}
                </button>
                <button type="button" className={`${styles.ownerMenuItem} ${styles.ownerMenuDanger}`} role="menuitem" onClick={handleDeleteNote} disabled={deleting}>
                  {deleting ? 'Eliminando...' : 'Eliminar nota'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {editing ? (
        <div className={styles.editWrap}>
          <textarea className={styles.editTextarea} value={editValue} maxLength={280} onChange={(event) => setEditValue(event.target.value)} />
          <div className={styles.editFooter}>
            <span>{280 - editValue.length} restantes</span>
            <button className={styles.saveButton} onClick={handleSaveEdit} disabled={savingEdit || !editValue.trim()}>{savingEdit ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      ) : (
        <p className={styles.content}>{note.content}</p>
      )}

      {imageCount > 0 && (
        <div
          className={[
            styles.imagesGrid,
            imageCount === 1 ? styles.imagesGridSingle : '',
            imageCount === 2 ? styles.imagesGridTwo : '',
            imageCount === 3 ? styles.imagesGridThree : '',
            imageCount >= 4 ? styles.imagesGridFour : '',
          ].join(' ').trim()}
        >
          {note.images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={styles.imageButton}
              onClick={() => handleOpenViewer(index)}
              aria-label={`Ver imagen ${index + 1} en grande`}
            >
              <img src={toAbsoluteAssetUrl(image.image_url)} alt={`Imagen ${index + 1} de la nota`} className={styles.noteImage} />
            </button>
          ))}
        </div>
      )}

      {viewerOpen && imageCount > 0 ? (
        <div
          className={styles.viewerOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de imágenes"
          onClick={handleCloseViewer}
        >
          <div className={styles.viewerFrame} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.viewerClose}
              onClick={handleCloseViewer}
              aria-label="Cerrar visor de imágenes"
            >
              Cerrar
            </button>
            {imageCount > 1 ? (
              <button
                type="button"
                className={`${styles.viewerNavButton} ${styles.viewerNavPrev}`}
                onClick={handlePrevImage}
                aria-label="Imagen anterior"
              >
                &#8249;
              </button>
            ) : null}
            <img
              src={toAbsoluteAssetUrl(note.images[viewerIndex]?.image_url)}
              alt={`Imagen ${viewerIndex + 1} de ${imageCount}`}
              className={styles.viewerImage}
            />
            {imageCount > 1 ? (
              <button
                type="button"
                className={`${styles.viewerNavButton} ${styles.viewerNavNext}`}
                onClick={handleNextImage}
                aria-label="Imagen siguiente"
              >
                &#8250;
              </button>
            ) : null}
            {imageCount > 1 ? <p className={styles.viewerCounter}>{viewerIndex + 1} / {imageCount}</p> : null}
          </div>
        </div>
      ) : null}

      <div className={styles.meta}><span>{formatDate(note.created_at)}</span></div>

      <div className={styles.interactions}>
        <button type="button" className={`${styles.interactionButton} ${liked ? styles.liked : ''}`} onClick={handleToggleLike}>❤️ {likesCount}</button>
        <button type="button" className={`${styles.interactionButton} ${bookmarked ? styles.liked : ''}`} onClick={handleToggleBookmark}>🔖</button>
        <button type="button" className={styles.interactionButton} onClick={handleToggleComments}>💬 {commentsCount}</button>
      </div>

      {showComments ? (
        <div className={styles.commentsSection}>
          {commentsLoading ? <p className={styles.commentsState}>Cargando respuestas...</p> : <CommentsList comments={comments} />}
          {isAuthenticated ? <CommentComposer onSubmit={handleCreateComment} loading={sendingComment} /> : <p className={styles.commentsState}>Inicia sesión para responder.</p>}
        </div>
      ) : null}
    </article>
  );
}

export default NoteCard;
