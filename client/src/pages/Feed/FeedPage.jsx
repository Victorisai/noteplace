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
import useDebounce from '../../hooks/useDebounce';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import styles from './FeedPage.module.css';

function FeedPage() {
  const { showToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const debouncedSearch = useDebounce(search, 400);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useDocumentTitle('Feed | NotePlace');

  const loadFeed = useCallback(async (reset = false) => {
    if (reset) setLoadingFeed(true);
    else setLoadingMore(true);

    try {
      setError('');
      const data = await getFeedNotes({ cursor: reset ? null : cursor, limit: 10, q: debouncedSearch });
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
  }, [cursor, debouncedSearch, showToast]);

  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    loadFeed(true);
  }, [debouncedSearch]);

  const sentinelRef = useInfiniteScroll({
    enabled: !loadingFeed && !loadingMore && hasMore,
    onIntersect: () => loadFeed(false),
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
        <input className={styles.feedSearch} type="text" placeholder="Filtrar feed por texto o usuario..." value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          <NoteComposer onSubmit={handleCreateNote} loading={publishing} />
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
