import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NotesList from '../../components/notes/NotesList';
import { deleteNote, getNotesByUsername } from '../../services/noteService';
import { useAuth } from '../../context/AuthContext';
import EditProfileForm from '../../components/profile/EditProfileForm';
import Avatar from '../../components/ui/Avatar';
import PageLoader from '../../components/common/PageLoader';
import ConfirmModal from '../../components/ui/ConfirmModal';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useToast from '../../hooks/useToast';
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useDocumentTitle(profile ? `@${profile.username} | NotePlace` : 'Perfil | NotePlace');

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

  function handleAskDelete(noteId) {
    setSelectedNoteId(noteId);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    try {
      setDeletingId(selectedNoteId);
      setError('');

      await deleteNote(selectedNoteId);
      setNotes((prev) => prev.filter((note) => note.id !== selectedNoteId));
      setProfile((prev) => ({
        ...prev,
        notes_count: Math.max((prev?.notes_count || 1) - 1, 0),
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

  if (loading) {
    return <PageLoader text="Cargando perfil..." />;
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
        <Avatar
          name={profile?.name}
          avatarUrl={profile?.avatar_url}
          size="lg"
        />

        <div className={styles.info}>
          <h1 className={styles.name}>{profile?.name}</h1>
          <p className={styles.username}>@{profile?.username}</p>
          <p className={styles.bio}>
            {profile?.bio || 'Este usuario aún no ha agregado una biografía.'}
          </p>

          <div className={styles.stats}>
            <span>{profile?.notes_count || 0} notas</span>
            {isOwnProfile ? <span>Este es tu perfil</span> : null}
          </div>
        </div>
      </div>

      {isOwnProfile ? <EditProfileForm /> : null}

      <div className={styles.notesSection}>
        <h2 className={styles.sectionTitle}>Notas publicadas</h2>

        <NotesList
          notes={notes}
          onDelete={handleAskDelete}
          onUpdate={handleUpdateNote}
          deletingId={deletingId}
          emptyMessage="Este usuario todavía no ha publicado notas."
        />
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

export default ProfilePage;