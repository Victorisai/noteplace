import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NotesList from '../../components/notes/NotesList';
import FollowListModal from '../../components/profile/FollowListModal';
import {
  deleteNote,
  getBookmarkedNotesByUsername,
  getLikedNotesByUsername,
  getNotesByUsername,
  getProfileSummary,
  getRepliesByUsername,
} from '../../services/noteService';
import {
  getFollowersByUsername,
  getFollowingByUsername,
  removeFollower,
  toggleFollow,
} from '../../services/followService';
import { useAuth } from '../../context/AuthContext';
import useToast from '../../hooks/useToast';
import EditProfileForm from '../../components/profile/EditProfileForm';
import Avatar from '../../components/ui/Avatar';
import PageLoader from '../../components/common/PageLoader';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { toAbsoluteAssetUrl } from '../../services/api';
import styles from './ProfilePage.module.css';

function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [replies, setReplies] = useState([]);
  const [likes, setLikes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [tab, setTab] = useState('notes');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState('followers');
  const [followUsers, setFollowUsers] = useState([]);
  const [followUsersLoading, setFollowUsersLoading] = useState(false);
  const [followActionLoadingId, setFollowActionLoadingId] = useState(null);

  const isOwnProfile = user?.username === profile?.username;

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const [profileData, notesData, repliesData, likesData, bookmarksData] = await Promise.all([
        getProfileSummary(username),
        getNotesByUsername(username),
        getRepliesByUsername(username),
        getLikedNotesByUsername(username),
        getBookmarkedNotesByUsername(username),
      ]);
      setProfile(profileData.profile);
      setNotes(notesData.notes || []);
      setReplies(repliesData.replies || []);
      setLikes(likesData.notes || []);
      setBookmarks(bookmarksData.notes || []);
      setLoading(false);
    }
    loadProfile();
  }, [username]);

  async function handleFollowToggle() {
    if (!profile?.id || followLoading) return;

    try {
      setFollowLoading(true);
      const data = await toggleFollow(profile.id);
      const parsedIsFollowing = data?.is_following === true
        || data?.is_following === 'true'
        || data?.is_following === 't'
        || data?.is_following === 1
        || data?.is_following === '1';

      setProfile((prev) => {
        if (!prev) return prev;
        const previousFollowing = Boolean(prev.is_following);
        const nextFollowing = parsedIsFollowing;
        const baseFollowers = Number(prev.followers_count) || 0;
        const followersCount = previousFollowing === nextFollowing
          ? baseFollowers
          : Math.max(0, baseFollowers + (nextFollowing ? 1 : -1));

        return {
          ...prev,
          is_following: nextFollowing,
          followers_count: followersCount,
        };
      });
      const profileData = await getProfileSummary(username);
      setProfile(profileData.profile);
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar el seguimiento', 'error');
    } finally {
      setFollowLoading(false);
    }
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

  async function handleOpenFollowList(type) {
    try {
      setFollowListType(type);
      setFollowListOpen(true);
      setFollowUsersLoading(true);

      const data = type === 'followers'
        ? await getFollowersByUsername(username)
        : await getFollowingByUsername(username);

      setFollowUsers(data.users || []);
    } catch (error) {
      showToast(error.message || 'No se pudo cargar la lista', 'error');
      setFollowUsers([]);
    } finally {
      setFollowUsersLoading(false);
    }
  }

  async function handleFollowListAction(targetUser) {
    if (!isOwnProfile || !targetUser?.id) return;

    try {
      setFollowActionLoadingId(targetUser.id);

      if (followListType === 'followers') {
        await removeFollower(targetUser.id);
        setFollowUsers((prev) => prev.filter((userItem) => userItem.id !== targetUser.id));
        setProfile((prev) => (prev ? {
          ...prev,
          followers_count: Math.max(0, (Number(prev.followers_count) || 0) - 1),
        } : prev));
        showToast('Seguidor eliminado correctamente', 'success');
        return;
      }

      const data = await toggleFollow(targetUser.id);
      const parsedIsFollowing = data?.is_following === true
        || data?.is_following === 'true'
        || data?.is_following === 't'
        || data?.is_following === 1
        || data?.is_following === '1';

      if (!parsedIsFollowing) {
        setFollowUsers((prev) => prev.filter((userItem) => userItem.id !== targetUser.id));
        setProfile((prev) => (prev ? {
          ...prev,
          following_count: Math.max(0, (Number(prev.following_count) || 0) - 1),
        } : prev));
      }

      showToast('Dejaste de seguir a este usuario', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo completar la acción', 'error');
    } finally {
      setFollowActionLoadingId(null);
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
            <button type="button" className={styles.statButton} onClick={() => handleOpenFollowList('followers')}>
              {profile?.followers_count || 0} seguidores
            </button>
            <button type="button" className={styles.statButton} onClick={() => handleOpenFollowList('following')}>
              {profile?.following_count || 0} siguiendo
            </button>
            <span>{profile?.notes_count || 0} notas</span>
          </div>
          {!isOwnProfile && (
            <button
              type="button"
              className={`${styles.followButton} ${profile?.is_following ? styles.followButtonFollowing : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? 'Procesando...' : (profile?.is_following ? 'Dejar de seguir' : 'Seguir')}
            </button>
          )}
        </div>
      </div>

      {isOwnProfile ? (
        <section className={styles.profileDetailsCard}>
          {!editingProfile ? (
            <>
              <div className={styles.profileDetailsHeader}>
                <h2>Información del perfil</h2>
                <button type="button" className={styles.editProfileButton} onClick={() => setEditingProfile(true)}>Editar perfil</button>
              </div>
              <div className={styles.profileDetailsGrid}>
                <div><span className={styles.detailLabel}>Nombre</span><p>{profile?.name || 'Sin nombre'}</p></div>
                <div><span className={styles.detailLabel}>Usuario</span><p>@{profile?.username}</p></div>
                <div className={styles.detailFull}><span className={styles.detailLabel}>Biografía</span><p>{profile?.bio || 'Aún no agregaste una biografía.'}</p></div>
              </div>
            </>
          ) : (
            <EditProfileForm
              showTitle={false}
              onCancel={() => setEditingProfile(false)}
              onSaved={(updatedUser) => {
                setProfile((prev) => (prev ? {
                  ...prev,
                  name: updatedUser?.name ?? prev.name,
                  username: updatedUser?.username ?? prev.username,
                  bio: updatedUser?.bio ?? prev.bio,
                  avatar_url: updatedUser?.avatar_url ?? prev.avatar_url,
                } : prev));
                setEditingProfile(false);
              }}
            />
          )}
        </section>
      ) : null}

      <div className={styles.tabs}>
        <button type="button" className={`${styles.tabButton} ${tab === 'notes' ? styles.tabButtonActive : ''}`} onClick={() => setTab('notes')}>Notas</button>
        <button type="button" className={`${styles.tabButton} ${tab === 'replies' ? styles.tabButtonActive : ''}`} onClick={() => setTab('replies')}>Respuestas</button>
        <button type="button" className={`${styles.tabButton} ${tab === 'likes' ? styles.tabButtonActive : ''}`} onClick={() => setTab('likes')}>Likes</button>
        <button type="button" className={`${styles.tabButton} ${tab === 'bookmarks' ? styles.tabButtonActive : ''}`} onClick={() => setTab('bookmarks')}>Guardados</button>
      </div>

      {tab === 'notes' ? <NotesList notes={notes} onDelete={(id) => { setSelectedNoteId(id); setConfirmOpen(true); }} deletingId={deletingId} onUpdate={(u) => setNotes((prev) => prev.map((n) => n.id === u.id ? u : n))} /> : null}
      {tab === 'replies' ? <ul>{replies.map((r) => <li key={r.id}>{r.content}</li>)}</ul> : null}
      {tab === 'likes' ? <NotesList notes={likes} onDelete={() => {}} onUpdate={() => {}} /> : null}
      {tab === 'bookmarks' ? <NotesList notes={bookmarks} onDelete={() => {}} onUpdate={() => {}} /> : null}

      <ConfirmModal isOpen={confirmOpen} title="Eliminar nota" description="Esta acción no se puede deshacer." confirmText="Eliminar" cancelText="Cancelar" onConfirm={handleConfirmDelete} onCancel={() => { setConfirmOpen(false); setSelectedNoteId(null); }} loading={Boolean(deletingId)} />
      <FollowListModal
        isOpen={followListOpen}
        title={followListType === 'followers' ? `Seguidores de @${profile?.username}` : `Siguiendo de @${profile?.username}`}
        users={followUsers}
        loading={followUsersLoading}
        actionLabel={followListType === 'followers' ? 'Eliminar seguido' : 'Dejar de seguir'}
        actionLoadingId={followActionLoadingId}
        onAction={isOwnProfile ? handleFollowListAction : null}
        emptyMessage={followListType === 'followers' ? 'Este perfil aún no tiene seguidores.' : 'Este perfil aún no sigue a nadie.'}
        onClose={() => {
          setFollowListOpen(false);
          setFollowActionLoadingId(null);
        }}
      />
    </section>
  );
}

export default ProfilePage;
