import { useEffect, useState } from 'react';
import NoteComposer from '../../components/notes/NoteComposer';
import NotesList from '../../components/notes/NotesList';
import { createNote, deleteNote, getFeedNotes } from '../../services/noteService';
import styles from './FeedPage.module.css';

function FeedPage() {
  const [notes, setNotes] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    try {
      setLoadingFeed(true);
      setError('');
      const data = await getFeedNotes();
      setNotes(data.notes);
    } catch (err) {
      setError(err.message);
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
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeleteNote(noteId) {
    try {
      setDeletingId(noteId);
      setError('');

      await deleteNote(noteId);

      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
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

      <div className={styles.content}>
        <div className={styles.mainColumn}>
          <NoteComposer onSubmit={handleCreateNote} loading={publishing} />

          {error ? <p className={styles.error}>{error}</p> : null}

          {loadingFeed ? (
            <div className={styles.loadingCard}>
              <p>Cargando notas...</p>
            </div>
          ) : (
            <NotesList
              notes={notes}
              onDelete={handleDeleteNote}
              deletingId={deletingId}
              emptyMessage="Todavía no hay notas publicadas. Sé el primero en compartir algo."
            />
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
            <h3>Tip</h3>
            <p>
              Escribe algo breve, claro y auténtico. Las mejores notas suelen ser simples.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default FeedPage;