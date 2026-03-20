import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { selectActiveConversationId } from '../../features/messages/messagesSlice';
import { getNotesByUsername } from '../../services/noteService';
import { useToastContext } from '../../context/ToastContext';
import MainHeader from './MainHeader';
import UserSideMenu from './UserSideMenu';
import styles from './MainLayout.module.css';

function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const location = useLocation();
  const activeConversationId = useSelector(selectActiveConversationId);
  const [notesCount, setNotesCount] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(72);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 980px)').matches;
  });
  const [isDesktopAsideEnabled, setIsDesktopAsideEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1181px)').matches;
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

  const handleHeaderVisibilityChange = useCallback((nextIsVisible) => {
    setIsHeaderVisible((prev) => (prev === nextIsVisible ? prev : nextIsVisible));
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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(min-width: 1181px)');
    const syncMedia = () => setIsDesktopAsideEnabled(media.matches);
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
  const showDesktopUserSideMenu = isAuthenticated && isDesktopAsideEnabled;
  const showHeaderUserMenu = isAuthenticated && !showDesktopUserSideMenu;

  return (
    <div
      className={styles.app}
      style={{
        '--header-height': `${showChatHeaderOnly ? 0 : headerHeight}px`,
        '--header-visible-height': `${showChatHeaderOnly ? 0 : isHeaderVisible ? headerHeight : 0}px`,
      }}
    >
      {!showChatHeaderOnly ? (
        <MainHeader
          isAuthenticated={isAuthenticated}
          showUserMenu={showHeaderUserMenu}
          user={user}
          notesCount={notesCount}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
          onHeightChange={handleHeaderHeightChange}
          onVisibilityChange={handleHeaderVisibilityChange}
        />
      ) : null}

      {showDesktopUserSideMenu ? (
        <UserSideMenu
          isOpen
          variant="desktop"
          user={user}
          notesCount={notesCount}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
      ) : null}

      <main
        className={`${styles.main} ${showDesktopUserSideMenu ? styles.mainWithDesktopUserSideMenu : ''}`}
        style={showChatHeaderOnly ? { paddingTop: 0 } : undefined}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
