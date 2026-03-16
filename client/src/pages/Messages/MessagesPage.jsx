import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useToast from '../../hooks/useToast';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import PageLoader from '../../components/common/PageLoader';
import { useAuth } from '../../context/AuthContext';
import MessagesSidebar from '../../components/messages/MessagesSidebar';
import MessagesChatWindow from '../../components/messages/MessagesChatWindow';
import {
  clearMessages,
  fetchConversationMessages,
  fetchConversations,
  processIncomingMessage,
  selectActiveConversationId,
  selectConversations,
  selectConversationsLoading,
  setActiveConversationId,
} from '../../features/messages/messagesSlice';
import {
  connectMessagingSocket,
  disconnectMessagingSocket,
  subscribeToIncomingMessages,
} from '../../services/messagingSocket';
import styles from './MessagesPage.module.css';

function MessagesPage() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { showToast } = useToast();

  const conversations = useSelector(selectConversations);
  const conversationsLoading = useSelector(selectConversationsLoading);
  const activeConversationId = useSelector(selectActiveConversationId);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 980px)').matches;
  });
  const [shellHeight, setShellHeight] = useState(null);
  const [shellViewportTop, setShellViewportTop] = useState(0);
  const shellRef = useRef(null);

  useDocumentTitle('Mensajes | NotePlace');

  useEffect(() => {
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
    dispatch(fetchConversations({ isMobile }))
      .catch((error) => {
        showToast(error.message || 'No se pudieron cargar tus conversaciones', 'error');
      });
  }, [dispatch, isMobile, showToast]);

  useEffect(() => {
    if (!isMobile && !activeConversationId && conversations.length) {
      dispatch(setActiveConversationId(conversations[0].id));
    }
  }, [activeConversationId, conversations, dispatch, isMobile]);

  useEffect(() => {
    if (!activeConversationId) return;
    if (conversations.some((item) => item.id === activeConversationId)) return;

    if (isMobile) {
      dispatch(setActiveConversationId(null));
      return;
    }

    dispatch(setActiveConversationId(conversations[0]?.id || null));
  }, [activeConversationId, conversations, dispatch, isMobile]);

  useEffect(() => {
    if (!activeConversationId) {
      dispatch(clearMessages());
      return;
    }

    dispatch(fetchConversationMessages(activeConversationId))
      .catch((error) => {
        showToast(error.message || 'No se pudieron cargar los mensajes', 'error');
      });
  }, [activeConversationId, dispatch, showToast]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const isChatOnlyMobile = isMobile && Boolean(activeConversationId);

    const syncShellHeight = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const viewportHeight = Math.floor(window.visualViewport?.height ?? window.innerHeight);
      const viewportTop = Math.max(0, Math.floor(window.visualViewport?.offsetTop ?? 0));
      const shellTop = isChatOnlyMobile ? 0 : Math.max(0, Math.floor(shell.getBoundingClientRect().top));
      const availableHeight = Math.max(0, viewportHeight - shellTop);
      const nextHeight = Math.max(320, availableHeight);
      const nextViewportTop = isChatOnlyMobile ? viewportTop : 0;

      setShellViewportTop((prev) => (prev === nextViewportTop ? prev : nextViewportTop));
      setShellHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    const visualViewport = window.visualViewport;
    syncShellHeight();
    const rafId = window.requestAnimationFrame(syncShellHeight);
    window.addEventListener('resize', syncShellHeight);
    visualViewport?.addEventListener('resize', syncShellHeight);
    if (isChatOnlyMobile) {
      visualViewport?.addEventListener('scroll', syncShellHeight);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncShellHeight);
      visualViewport?.removeEventListener('resize', syncShellHeight);
      if (isChatOnlyMobile) {
        visualViewport?.removeEventListener('scroll', syncShellHeight);
      }
    };
  }, [isMobile, activeConversationId]);

  useEffect(() => {
    const token = localStorage.getItem('noteplace_token');
    if (!token) return undefined;

    connectMessagingSocket(token);
    const unsubscribe = subscribeToIncomingMessages((payload) => {
      const incoming = payload?.message;
      if (!incoming?.id) return;

      const result = dispatch(processIncomingMessage({ incoming, currentUserId: user?.id }));

      if (result?.shouldRefreshConversations) {
        dispatch(fetchConversations({ isMobile })).catch(() => {});
      }
    });

    return () => {
      unsubscribe();
      disconnectMessagingSocket();
    };
  }, [dispatch, isMobile, user?.id]);

  if (conversationsLoading) return <PageLoader text="Cargando mensajes..." />;

  const showSidebarOnMobile = !activeConversationId;
  const showChatOnlyMobile = isMobile && !showSidebarOnMobile;
  const shellStyle = {
    ...(shellHeight ? { '--messages-shell-height': `${shellHeight}px` } : {}),
    ...(showChatOnlyMobile ? { '--messages-shell-top': `${shellViewportTop}px` } : {}),
  };

  return (
    <section className={`${styles.page} ${showChatOnlyMobile ? styles.pageChatOnlyMobile : ''}`}>
      <div
        ref={shellRef}
        className={`${styles.shell} ${showChatOnlyMobile ? styles.shellChatOnlyMobile : ''}`}
        style={Object.keys(shellStyle).length ? shellStyle : undefined}
      >
        <div className={`${styles.sidebarPane} ${isMobile && !showSidebarOnMobile ? styles.hiddenOnMobile : ''}`}>
          <MessagesSidebar />
        </div>

        <div className={`${styles.chatPane} ${isMobile && showSidebarOnMobile ? styles.hiddenOnMobile : ''}`}>
          <MessagesChatWindow isMobile={isMobile} />
        </div>
      </div>
    </section>
  );
}

export default MessagesPage;
