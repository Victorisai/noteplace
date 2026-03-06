import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NotesList from '../../components/notes/NotesList';
import { deleteNote, getNotesByUsername } from '../../services/noteService';
import { useAuth } from '../../context/AuthContext';
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [username]);

  async function loadProfile() {
    try {
      setLoading(true);
      setError('');

      const data = await getNotesByUsername(username);

      setProfile(data.profile);
      setNotes(data.notes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.profileCard}>
          <p>Cargando perfil...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.page}>
        <div className={styles.profileCard}>
          <p className={styles.error}>{error}</p>
        </div>
      </section>
    );
  }

  const isOwnProfile = user?.username === profile?.username;

  return (
    <section className={styles.page}>
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          {profile?.name?.charAt(0)?.toUpperCase() || 'N'}
        </div>

        <div className={styles.info}>
          <h1 className={styles.name}>{profile?.name}</h1>
          <p className={styles.username}>@{profile?.username}</p>
          <p className={styles.bio}>
            {profile?.bio || 'Este usuario aún no ha agregado una biografía.'}
          </p>

          <div className={styles.stats}>
            <span>{notes.length} notas</span>
            {isOwnProfile ? <span>Este es tu perfil</span> : null}
          </div>
        </div>
      </div>

      <div className={styles.notesSection}>
        <h2 className={styles.sectionTitle}>Notas publicadas</h2>

        <NotesList
          notes={notes}
          onDelete={handleDeleteNote}
          deletingId={deletingId}
          emptyMessage="Este usuario todavía no ha publicado notas."
        />
      </div>
    </section>
  );
}

export default ProfilePage;