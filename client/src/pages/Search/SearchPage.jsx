import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { searchAll } from '../../services/searchService';
import styles from './SearchPage.module.css';

function formatDate(dateString) {
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateString));
}

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], notes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  const debouncedQuery = useDebounce(query, 350);

  useDocumentTitle('Buscar | NotePlace');

  useEffect(() => {
    async function runSearch() {
      if (!debouncedQuery.trim()) {
        setResults({ users: [], notes: [] });
        setError('');
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await searchAll(debouncedQuery);
        setResults({
          users: data?.users || [],
          notes: data?.notes || [],
        });
      } catch (err) {
        setResults({ users: [], notes: [] });
        setError(err.message || 'No se pudo completar la búsqueda.');
      } finally {
        setLoading(false);
      }
    }

    runSearch();
  }, [debouncedQuery]);

  const totalResults = results.users.length + results.notes.length;

  const sections = useMemo(() => {
    if (tab === 'profiles') {
      return { users: results.users, notes: [] };
    }

    if (tab === 'notes') {
      return { users: [], notes: results.notes };
    }

    return results;
  }, [results, tab]);
  const shouldUseSingleColumn = sections.users.length === 0 || sections.notes.length === 0;

  return (
    <section className={styles.page}>
      <div className={styles.searchCard}>
        <div className={styles.searchHeader}>
          <h1 className={styles.title}>Buscar</h1>
          <p className={styles.subtitle}>Encuentra perfiles y notas con más detalle.</p>
        </div>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="Busca por nombre, usuario o contenido..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === 'all' ? styles.tabButtonActive : ''}`}
            onClick={() => setTab('all')}
          >
            Todo
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === 'profiles' ? styles.tabButtonActive : ''}`}
            onClick={() => setTab('profiles')}
          >
            Perfiles ({results.users.length})
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === 'notes' ? styles.tabButtonActive : ''}`}
            onClick={() => setTab('notes')}
          >
            Notas ({results.notes.length})
          </button>
        </div>

        {query.trim() ? (
          <p className={styles.meta}>
            {loading ? 'Buscando...' : `${totalResults} resultado${totalResults === 1 ? '' : 's'} para "${debouncedQuery}"`}
          </p>
        ) : (
          <p className={styles.meta}>Escribe algo para empezar a buscar.</p>
        )}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {!query.trim() ? null : (
        <div className={`${styles.resultsGrid} ${shouldUseSingleColumn ? styles.resultsGridSingle : ''}`}>
          {sections.users.length > 0 ? (
            <section className={styles.resultsCard}>
              <h2 className={styles.sectionTitle}>Perfiles</h2>
              <div className={styles.list}>
                {sections.users.map((user) => (
                  <Link key={`user-${user.id}`} to={`/profile/${user.username}`} className={styles.resultItem}>
                    <Avatar name={user.name || user.username} avatarUrl={user.avatar_url} size="md" />
                    <div className={styles.resultMain}>
                      <div className={styles.resultHeader}>
                        <strong>{user.name || user.username}</strong>
                        <span>@{user.username}</span>
                      </div>
                      <p className={styles.resultText}>{user.bio || 'Este perfil aún no tiene biografía.'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {sections.notes.length > 0 ? (
            <section className={styles.resultsCard}>
              <h2 className={styles.sectionTitle}>Notas</h2>
              <div className={styles.list}>
                {sections.notes.map((note) => (
                  <article key={`note-${note.id}`} className={styles.resultItem}>
                    <Avatar name={note.user?.name || note.user?.username} avatarUrl={note.user?.avatar_url} size="md" />
                    <div className={styles.resultMain}>
                      <div className={styles.resultHeader}>
                        <strong>{note.user?.name || note.user?.username}</strong>
                        <span>@{note.user?.username}</span>
                      </div>
                      <p className={styles.resultText}>{note.content}</p>
                      <div className={styles.noteMeta}>
                        <span>{formatDate(note.created_at)}</span>
                        <Link to={`/profile/${note.user?.username}`} className={styles.noteLink}>Ver perfil</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {!loading && sections.users.length === 0 && sections.notes.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Sin resultados</h3>
              <p>No encontramos coincidencias. Prueba con otro término.</p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

export default SearchPage;
