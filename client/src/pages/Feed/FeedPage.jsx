import { useEffect, useState } from 'react';
import NoteComposer from '../../components/notes/NoteComposer';
import NotesList from '../../components/notes/NotesList';
import SkeletonNoteCard from '../../components/common/SkeletonNoteCard';
import SearchPanel from '../../components/common/SearchPanel';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { createNote, deleteNote, getFeedNotes } from '../../services/noteService';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useToast from '../../hooks/useToast';
import useDebounce from '../../hooks/useDebounce';
import styles from './FeedPage.module.css';

function FeedPage() {
  const { showToast } = useToast();

  const [notes, setNotes] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useDocumentTitle('Feed | NotePlace');

  useEffect(() => {
    loadFeed(page, debouncedSearch);
  }, [page, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function loadFeed(currentPage = 1, query = '') {
    try {
      setLoadingFeed(true);
      setError('');

      const data = await getFeedNotes({
        page: currentPage,
        limit: 10,
        q: query,
      });

      setNotes(data.notes);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoadingFeed(false);
    }
  }

  async function handleCreateNote(content) {
    try {
      setPublishing(true);
      setError('');

      const data = await createNote({ content });
      setNotes((prev) => [data.note, ...prev]);
      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
      }));
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

  function handleAskDelete(noteId) {
    setSelectedNoteId(noteId);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!selectedNoteId) return;

    try {
      setDeletingId(selectedNoteId);
      setError('');

      await deleteNote(selectedNoteId);

      setNotes((prev) => prev.filter((note) => note.id !== selectedNoteId));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(prev.total - 1, 0),
      }));

      showToast('Nota eliminada correctamente', 'success');
      setConfirmOpen(false);
      setSelectedNoteId(null);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function handleUpdateNote(updatedNote) {
    setNotes((prev) =>
      prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.title}>Feed</h1>
          <p className={styles.subtitle}>
            Publica ideas cortas y mira lo que comparte la comunidad.
          </p>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <SearchPanel />
        <input
          className={styles.feedSearch}
          type="text"
          placeholder="Filtrar feed por texto o usuario..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          <NoteComposer onSubmit={handleCreateNote} loading={publishing} />

          {error ? <p className={styles.error}>{error}</p> : null}

          {loadingFeed ? (
            <div className={styles.skeletonList}>
              <SkeletonNoteCard />
              <SkeletonNoteCard />
              <SkeletonNoteCard />
            </div>
          ) : (
            <>
              <NotesList
                notes={notes}
                onDelete={handleAskDelete}
                onUpdate={handleUpdateNote}
                deletingId={deletingId}
                emptyMessage="Todavía no hay notas publicadas. Sé el primero en compartir algo."
              />

              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                >
                  Anterior
                </button>

                <span>
                  Página {pagination.page} de {pagination.totalPages || 1}
                </span>

                <button
                  className={styles.pageButton}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages || 1)
                    )
                  }
                  disabled={page >= (pagination.totalPages || 1)}
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.sideCard}>
            <h3>Sobre NotePlace</h3>
            <p>
              Un lugar para compartir ideas, pensamientos, avances y notas rápidas.
            </p>
          </div>

          <div className={styles.sideCard}>
            <h3>Estadísticas</h3>
            <p>Total de notas encontradas: {pagination.total}</p>
          </div>
        </aside>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Eliminar nota"
        description="Esta acción no se puede deshacer. ¿Seguro que quieres eliminar esta nota?"
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedNoteId(null);
        }}
        loading={Boolean(deletingId)}
      />
    </section>
  );
}

export default FeedPage;