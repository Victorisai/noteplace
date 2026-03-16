import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { selectActiveConversationId } from '../../features/messages/messagesSlice';
import { getNotesByUsername } from '../../services/noteService';
import { useToastContext } from '../../context/ToastContext';
import MainHeader from './MainHeader';
import styles from './MainLayout.module.css';

function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const location = useLocation();
  const activeConversationId = useSelector(selectActiveConversationId);
  const [notesCount, setNotesCount] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 980px)').matches;
  });

  useEffect(() => {
    async function loadCount() {
      if (!user?.username) {
        setNotesCount(0);
        return;
      }

      try {
        const data = await getNotesByUsername(user.username);
        setNotesCount(data.profile?.notes_count || 0);
      } catch {
        setNotesCount(0);
      }
    }

    loadCount();
  }, [user?.username]);

  const handleHeaderHeightChange = useCallback((nextHeight) => {
    setHeaderHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(max-width: 980px)');
    const syncMedia = () => setIsMobile(media.matches);
    syncMedia();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncMedia);
      return () => media.removeEventListener('change', syncMedia);
    }

    media.addListener(syncMedia);
    return () => media.removeListener(syncMedia);
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  function handleOpenSettings() {
    showToast('Configuraciones estará disponible pronto', 'info');
  }

  const isMessagesRoute = location.pathname.startsWith('/messages');
  const showChatHeaderOnly = isMessagesRoute && isMobile && Boolean(activeConversationId);

  return (
    <div
      className={styles.app}
      style={{ '--header-height': `${showChatHeaderOnly ? 0 : headerHeight}px` }}
    >
      {!showChatHeaderOnly ? (
        <MainHeader
          isAuthenticated={isAuthenticated}
          user={user}
          notesCount={notesCount}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
          onHeightChange={handleHeaderHeightChange}
        />
      ) : null}

      <main className={styles.main} style={showChatHeaderOnly ? { paddingTop: 0 } : undefined}>
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
