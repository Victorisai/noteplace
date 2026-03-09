import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NotesList from '../../components/notes/NotesList';
import { deleteNote, getLikedNotesByUsername, getNotesByUsername, getProfileSummary, getRepliesByUsername } from '../../services/noteService';
import { toggleFollow } from '../../services/followService';
import { useAuth } from '../../context/AuthContext';
import EditProfileForm from '../../components/profile/EditProfileForm';
import Avatar from '../../components/ui/Avatar';
import PageLoader from '../../components/common/PageLoader';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toAbsoluteAssetUrl } from '../../services/api';
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [replies, setReplies] = useState([]);
  const [likes, setLikes] = useState([]);
  const [tab, setTab] = useState('notes');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const isOwnProfile = user?.username === profile?.username;

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const [profileData, notesData, repliesData, likesData] = await Promise.all([
        getProfileSummary(username),
        getNotesByUsername(username),
        getRepliesByUsername(username),
        getLikedNotesByUsername(username),
      ]);
      setProfile(profileData.profile);
      setNotes(notesData.notes || []);
      setReplies(repliesData.replies || []);
      setLikes(likesData.notes || []);
      setLoading(false);
    }
    loadProfile();
  }, [username]);

  async function handleFollowToggle() {
    const data = await toggleFollow(profile.id);
    setProfile((prev) => ({
      ...prev,
      is_following: data.is_following,
      followers_count: prev.followers_count + (data.is_following ? 1 : -1),
    }));
  }

  async function handleConfirmDelete() {
    if (!selectedNoteId) return;

    try {
      setDeletingId(selectedNoteId);
      await deleteNote(selectedNoteId);
      setNotes((prev) => prev.filter((note) => note.id !== selectedNoteId));
      setConfirmOpen(false);
      setSelectedNoteId(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <PageLoader text="Cargando perfil..." />;

  return (
    <section className={styles.page}>
      <div className={styles.profileCard}>
        <Avatar name={profile?.name} avatarUrl={toAbsoluteAssetUrl(profile?.avatar_url)} size="lg" />
        <div className={styles.info}>
          <h1 className={styles.name}>{profile?.name}</h1>
          <p className={styles.username}>@{profile?.username}</p>
          <div className={styles.stats}>
            <span>{profile?.followers_count || 0} seguidores</span>
            <span>{profile?.following_count || 0} siguiendo</span>
            <span>{profile?.notes_count || 0} notas</span>
          </div>
          {!isOwnProfile && <button onClick={handleFollowToggle}>{profile?.is_following ? 'Dejar de seguir' : 'Seguir'}</button>}
        </div>
      </div>

      {isOwnProfile ? <EditProfileForm /> : null}

      <div className={styles.tabs}>
        <button onClick={() => setTab('notes')}>Notas</button>
        <button onClick={() => setTab('replies')}>Respuestas</button>
        <button onClick={() => setTab('likes')}>Likes</button>
      </div>

      {tab === 'notes' ? <NotesList notes={notes} onDelete={(id) => { setSelectedNoteId(id); setConfirmOpen(true); }} deletingId={deletingId} onUpdate={(u) => setNotes((prev) => prev.map((n) => n.id === u.id ? u : n))} /> : null}
      {tab === 'replies' ? <ul>{replies.map((r) => <li key={r.id}>{r.content}</li>)}</ul> : null}
      {tab === 'likes' ? <NotesList notes={likes} onDelete={() => {}} onUpdate={() => {}} /> : null}

      <ConfirmModal isOpen={confirmOpen} title="Eliminar nota" description="Esta acción no se puede deshacer." confirmText="Eliminar" cancelText="Cancelar" onConfirm={handleConfirmDelete} onCancel={() => { setConfirmOpen(false); setSelectedNoteId(null); }} loading={Boolean(deletingId)} />
    </section>
  );
}

export default ProfilePage;
