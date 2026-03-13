import { useCallback, useEffect, useState } from 'react';
import NoteComposer from '../../components/notes/NoteComposer';
import NotesList from '../../components/notes/NotesList';
import SkeletonNoteCard from '../../components/common/SkeletonNoteCard';
import SearchPanel from '../../components/common/SearchPanel';
import ConfirmModal from '../../components/ui/ConfirmModal';
import NotificationsPanel from '../../components/notifications/NotificationsPanel';
import { createNote, deleteNote, getFeedNotes } from '../../services/noteService';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useToast from '../../hooks/useToast';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import styles from './FeedPage.module.css';

const FEED_SEGMENTS = [
  { id: 'following', label: 'Siguiendo' },
  { id: 'discover', label: 'Descubrir' },
];

const FEED_SORTS = [
  { id: 'recent', label: 'Recientes' },
  { id: 'trending', label: 'Tendencias' },
];

const SEGMENT_HINTS = {
  following: 'Notas de cuentas que sigues (y las tuyas).',
  discover: 'Contenido nuevo de personas que todavía no sigues.',
};

function FeedPage() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [segment, setSegment] = useState('following');
  const [sort, setSort] = useState('recent');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useDocumentTitle('Feed | NotePlace');

  function resetFeedState() {
    setCursor(null);
    setHasMore(true);
    setNotes([]);
  }

  const loadFeed = useCallback(async ({ reset = false, cursorValue = null } = {}) => {
    if (reset) {
      setLoadingFeed(true);
    } else {
      setLoadingMore(true);
    }

    try {
      setError('');
      const data = await getFeedNotes({ cursor: reset ? null : cursorValue, limit: 10, segment, sort });
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setNotes((prev) => {
        const incoming = data.notes || [];
        if (reset) return incoming;
        const existing = new Set(prev.map((note) => note.id));
        return [...prev, ...incoming.filter((note) => !existing.has(note.id))];
      });
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoadingFeed(false);
      setLoadingMore(false);
    }
  }, [segment, showToast, sort]);

  useEffect(() => {
    loadFeed({ reset: true, cursorValue: null });
  }, [loadFeed, segment, sort]);

  const sentinelRef = useInfiniteScroll({
    enabled: !loadingFeed && !loadingMore && hasMore && cursor !== null,
    onIntersect: () => loadFeed({ reset: false, cursorValue: cursor }),
  });

  async function handleCreateNote(content, images) {
    try {
      setPublishing(true);
      const data = await createNote({ content, images });
      setNotes((prev) => [data.note, ...prev]);
      showToast('Nota publicada correctamente', 'success');
      return true;
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
      return false;
    } finally {
      setPublishing(false);
    }
  }

  function handleAskDelete(noteId) { setSelectedNoteId(noteId); setConfirmOpen(true); }

  async function handleConfirmDelete() {
    if (!selectedNoteId) return;
    try {
      setDeletingId(selectedNoteId);
      await deleteNote(selectedNoteId);
      setNotes((prev) => prev.filter((note) => note.id !== selectedNoteId));
      setConfirmOpen(false); setSelectedNoteId(null);
    } catch (err) { setError(err.message); } finally { setDeletingId(null); }
  }

  function handleUpdateNote(updatedNote) {
    setNotes((prev) => prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)));
  }

  return (
    <section className={styles.page}>
      <div className={styles.searchWrap}>
        <SearchPanel />
        <div className={styles.feedSegments} role="tablist" aria-label="Segmentos del feed">
          {FEED_SEGMENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={segment === item.id}
              className={`${styles.segmentButton} ${segment === item.id ? styles.segmentButtonActive : ''}`}
              onClick={() => {
                if (segment === item.id) return;
                resetFeedState();
                setSegment(item.id);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className={styles.segmentHint}>{SEGMENT_HINTS[segment]}</p>
      </div>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          <NoteComposer onSubmit={handleCreateNote} loading={publishing} />
          <div className={styles.feedSortWrap}>
            <p className={styles.sortLabel}>Ver notas por:</p>
            <div className={styles.feedSorts} role="tablist" aria-label="Orden del feed">
              {FEED_SORTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={sort === item.id}
                  className={`${styles.sortButton} ${sort === item.id ? styles.sortButtonActive : ''}`}
                  onClick={() => {
                    if (sort === item.id) return;
                    resetFeedState();
                    setSort(item.id);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          {loadingFeed ? <><SkeletonNoteCard /><SkeletonNoteCard /></> : <NotesList notes={notes} onDelete={handleAskDelete} onUpdate={handleUpdateNote} deletingId={deletingId} />}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore ? <p>Cargando más...</p> : null}
        </div>
        <aside className={styles.sidebar}><NotificationsPanel /></aside>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Eliminar nota"
        description="Esta acción no se puede deshacer. ¿Seguro que quieres eliminar esta nota?"
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => { setConfirmOpen(false); setSelectedNoteId(null); }}
        loading={Boolean(deletingId)}
      />
    </section>
  );
}

export default FeedPage;
