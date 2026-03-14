import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import useDebounce from '../../hooks/useDebounce';
import { searchAll } from '../../services/searchService';
import styles from './SearchPanel.module.css';

const PREVIEW_LIMIT = 4;

function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], notes: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const panelRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    setShowAllUsers(false);
    setShowAllNotes(false);

    async function runSearch() {
      if (!debouncedQuery.trim()) {
        setResults({ users: [], notes: [] });
        setIsOpen(false);
        return;
      }

      try {
        setLoading(true);
        const data = await searchAll(debouncedQuery);
        setResults(data);
      } catch (error) {
        setResults({ users: [], notes: [] });
      } finally {
        setLoading(false);
      }
    }

    runSearch();
  }, [debouncedQuery]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleSelectResult() {
    setQuery('');
    setResults({ users: [], notes: [] });
    setIsOpen(false);
    setShowAllUsers(false);
    setShowAllNotes(false);
  }

  const usersToRender = showAllUsers ? results.users : results.users.slice(0, PREVIEW_LIMIT);
  const notesToRender = showAllNotes ? results.notes : results.notes.slice(0, PREVIEW_LIMIT);
  const hasMoreUsers = results.users.length > PREVIEW_LIMIT;
  const hasMoreNotes = results.notes.length > PREVIEW_LIMIT;

  return (
    <div className={styles.panel} ref={panelRef}>
      <input
        type="text"
        className={styles.input}
        placeholder="Buscar usuarios o notas..."
        value={query}
        onFocus={() => {
          if (query.trim()) setIsOpen(true);
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          setIsOpen(Boolean(nextValue.trim()));
        }}
      />

      {isOpen && query.trim() ? (
        <div className={styles.results}>
          {loading ? <p className={styles.state}>Buscando...</p> : null}

          {!loading && results.users.length === 0 && results.notes.length === 0 ? (
            <p className={styles.state}>No se encontraron resultados.</p>
          ) : null}

          {results.users.length > 0 ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4>Usuarios</h4>
                {hasMoreUsers ? (
                  <button
                    type="button"
                    className={styles.showMoreButton}
                    onClick={() => setShowAllUsers((prev) => !prev)}
                  >
                    {showAllUsers ? 'Ver menos' : `Ver mas (${results.users.length})`}
                  </button>
                ) : null}
              </div>

              <div className={styles.list}>
                {usersToRender.map((user) => (
                  <Link
                    key={`user-${user.id}`}
                    to={`/profile/${user.username}`}
                    className={styles.resultItem}
                    onClick={handleSelectResult}
                  >
                    <Avatar
                      name={user.name}
                      avatarUrl={user.avatar_url}
                      size="sm"
                    />
                    <div className={styles.resultText}>
                      <strong>{user.name}</strong>
                      <p>@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {results.notes.length > 0 ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h4>Notas</h4>
                {hasMoreNotes ? (
                  <button
                    type="button"
                    className={styles.showMoreButton}
                    onClick={() => setShowAllNotes((prev) => !prev)}
                  >
                    {showAllNotes ? 'Ver menos' : `Ver mas (${results.notes.length})`}
                  </button>
                ) : null}
              </div>

              <div className={styles.list}>
                {notesToRender.map((note) => (
                  <Link
                    key={`note-${note.id}`}
                    to={`/profile/${note.user.username}`}
                    className={styles.resultItem}
                    onClick={handleSelectResult}
                  >
                    <Avatar
                      name={note.user.name}
                      avatarUrl={note.user.avatar_url}
                      size="sm"
                    />
                    <div className={styles.resultText}>
                      <strong>@{note.user.username}</strong>
                      <p>{note.content}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default SearchPanel;
