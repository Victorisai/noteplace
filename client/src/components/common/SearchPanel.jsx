import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import useDebounce from '../../hooks/useDebounce';
import { searchAll } from '../../services/searchService';
import styles from './SearchPanel.module.css';

function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], notes: [] });
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    async function runSearch() {
      if (!debouncedQuery.trim()) {
        setResults({ users: [], notes: [] });
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

  return (
    <div className={styles.panel}>
      <input
        type="text"
        className={styles.input}
        placeholder="Buscar usuarios o notas..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {query.trim() ? (
        <div className={styles.results}>
          {loading ? <p className={styles.state}>Buscando...</p> : null}

          {!loading && results.users.length === 0 && results.notes.length === 0 ? (
            <p className={styles.state}>No se encontraron resultados.</p>
          ) : null}

          {results.users.length > 0 ? (
            <div className={styles.section}>
              <h4>Usuarios</h4>
              <div className={styles.list}>
                {results.users.map((user) => (
                  <Link
                    key={`user-${user.id}`}
                    to={`/profile/${user.username}`}
                    className={styles.resultItem}
                  >
                    <Avatar
                      name={user.name}
                      avatarUrl={user.avatar_url}
                      size="sm"
                    />
                    <div>
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
              <h4>Notas</h4>
              <div className={styles.list}>
                {results.notes.map((note) => (
                  <Link
                    key={`note-${note.id}`}
                    to={`/profile/${note.user.username}`}
                    className={styles.resultItem}
                  >
                    <Avatar
                      name={note.user.name}
                      avatarUrl={note.user.avatar_url}
                      size="sm"
                    />
                    <div>
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