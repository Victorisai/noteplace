import { useEffect, useMemo, useRef, useState } from 'react';
import useToast from '../../hooks/useToast';
import useDebounce from '../../hooks/useDebounce';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import PageLoader from '../../components/common/PageLoader';
import { useAuth } from '../../context/AuthContext';
import MessagesSidebar from '../../components/messages/MessagesSidebar';
import MessagesChatWindow from '../../components/messages/MessagesChatWindow';
import {
  getConversationMessages,
  getMessageConversations,
  openConversationWithUser,
  searchFollowingForMessages,
  sendConversationMessage,
} from '../../services/messageService';
import {
  connectMessagingSocket,
  disconnectMessagingSocket,
  subscribeToIncomingMessages,
} from '../../services/messagingSocket';
import styles from './MessagesPage.module.css';

function upsertConversation(conversations, conversation) {
  const existingIndex = conversations.findIndex((item) => item.id === conversation.id);
  if (existingIndex === -1) return [conversation, ...conversations];

  const next = [...conversations];
  next.splice(existingIndex, 1);
  return [conversation, ...next];
}

function MessagesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 980px)').matches;
  });
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [shellHeight, setShellHeight] = useState(null);
  const shellRef = useRef(null);

  const debouncedSearch = useDebounce(search, 300);

  useDocumentTitle('Mensajes | NotePlace');

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

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
    async function loadConversations() {
      try {
        setConversationsLoading(true);
        const data = await getMessageConversations();
        const list = data.conversations || [];
        setConversations(list);
        setActiveConversationId((prev) => {
          if (prev) return prev;
          if (isMobile) return null;
          return list[0]?.id || null;
        });
      } catch (error) {
        showToast(error.message || 'No se pudieron cargar tus conversaciones', 'error');
      } finally {
        setConversationsLoading(false);
      }
    }

    loadConversations();
  }, [isMobile, showToast]);

  useEffect(() => {
    if (!isMobile && !activeConversationId && conversations.length) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations, isMobile]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        setMessagesLoading(true);
        const data = await getConversationMessages(activeConversationId, { limit: 60 });
        setMessages(data.messages || []);
      } catch (error) {
        showToast(error.message || 'No se pudieron cargar los mensajes', 'error');
      } finally {
        setMessagesLoading(false);
      }
    }

    loadMessages();
  }, [activeConversationId, showToast]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchUsers([]);
      setSearchingUsers(false);
      return;
    }

    async function runUserSearch() {
      try {
        setSearchingUsers(true);
        const data = await searchFollowingForMessages(debouncedSearch);
        setSearchUsers(data.users || []);
      } catch {
        setSearchUsers([]);
      } finally {
        setSearchingUsers(false);
      }
    }

    runUserSearch();
  }, [debouncedSearch]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncShellHeight = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const availableHeight = Math.floor(window.innerHeight - shell.getBoundingClientRect().top);
      const nextHeight = Math.max(320, availableHeight);
      setShellHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };

    syncShellHeight();
    const rafId = window.requestAnimationFrame(syncShellHeight);
    window.addEventListener('resize', syncShellHeight);
    window.visualViewport?.addEventListener('resize', syncShellHeight);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', syncShellHeight);
      window.visualViewport?.removeEventListener('resize', syncShellHeight);
    };
  }, [isMobile, activeConversationId]);

  useEffect(() => {
    const token = localStorage.getItem('noteplace_token');
    if (!token) return undefined;

    connectMessagingSocket(token);
    const unsubscribe = subscribeToIncomingMessages((payload) => {
      const incoming = payload?.message;
      if (!incoming?.id) return;

      let shouldRefreshConversations = false;
      setConversations((prev) => {
        const target = prev.find((item) => item.id === incoming.conversation_id);
        if (!target) {
          shouldRefreshConversations = true;
          return prev;
        }

        const unreadIncrement = incoming.sender_id !== user?.id
          && incoming.conversation_id !== activeConversationId ? 1 : 0;

        const updatedConversation = {
          ...target,
          updated_at: incoming.created_at,
          unread_count: Math.max(0, Number(target.unread_count || 0) + unreadIncrement),
          last_message: {
            id: incoming.id,
            sender_id: incoming.sender_id,
            content: incoming.content,
            created_at: incoming.created_at,
          },
        };

        return upsertConversation(prev, updatedConversation);
      });

      if (shouldRefreshConversations) {
        getMessageConversations()
          .then((data) => setConversations(data.conversations || []))
          .catch(() => {});
      }

      if (incoming.conversation_id === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === incoming.id)) return prev;
          return [...prev, incoming];
        });

        if (incoming.sender_id !== user?.id) {
          setConversations((prev) => prev.map((item) => (
            item.id === activeConversationId ? { ...item, unread_count: 0 } : item
          )));
        }
      }
    });

    return () => {
      unsubscribe();
      disconnectMessagingSocket();
    };
  }, [activeConversationId, user?.id]);

  async function handleOpenConversation(userItem) {
    try {
      const data = await openConversationWithUser(userItem.id);
      const conversation = data.conversation;
      if (!conversation) return;

      setConversations((prev) => upsertConversation(prev, conversation));
      setActiveConversationId(conversation.id);
      setSearch('');
      setSearchUsers([]);
    } catch (error) {
      showToast(error.message || 'No se pudo abrir la conversación', 'error');
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    if (!activeConversationId || sending) return;

    const trimmed = composer.trim();
    if (!trimmed) return;

    try {
      setSending(true);
      const data = await sendConversationMessage(activeConversationId, trimmed);
      const newMessage = data.message;

      setComposer('');
      setMessages((prev) => (prev.some((msg) => msg.id === newMessage.id) ? prev : [...prev, newMessage]));
      setConversations((prev) => prev.map((item) => (
        item.id === activeConversationId
          ? {
            ...item,
            updated_at: newMessage.created_at,
            unread_count: 0,
            last_message: {
              id: newMessage.id,
              sender_id: newMessage.sender_id,
              content: newMessage.content,
              created_at: newMessage.created_at,
            },
          }
          : item
      )));
    } catch (error) {
      showToast(error.message || 'No se pudo enviar el mensaje', 'error');
    } finally {
      setSending(false);
    }
  }

  function handleSelectConversation(conversationId) {
    setActiveConversationId(conversationId);
    setConversations((prev) => prev.map((item) => (
      item.id === conversationId ? { ...item, unread_count: 0 } : item
    )));
  }

  function handleBackToList() {
    if (!isMobile) return;
    setActiveConversationId(null);
  }

  if (conversationsLoading) return <PageLoader text="Cargando mensajes..." />;

  const showSidebarOnMobile = !activeConversationId;

  return (
    <section className={styles.page}>
      <div
        ref={shellRef}
        className={styles.shell}
        style={shellHeight ? { '--messages-shell-height': `${shellHeight}px` } : undefined}
      >
        <div className={`${styles.sidebarPane} ${isMobile && !showSidebarOnMobile ? styles.hiddenOnMobile : ''}`}>
          <MessagesSidebar
            search={search}
            onSearchChange={setSearch}
            searchingUsers={searchingUsers}
            searchUsers={searchUsers}
            onOpenConversation={handleOpenConversation}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        <div className={`${styles.chatPane} ${isMobile && showSidebarOnMobile ? styles.hiddenOnMobile : ''}`}>
          <MessagesChatWindow
            activeConversation={activeConversation}
            messages={messages}
            messagesLoading={messagesLoading}
            currentUserId={user?.id}
            composer={composer}
            sending={sending}
            isMobile={isMobile}
            onBack={handleBackToList}
            onComposerChange={setComposer}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </section>
  );
}

export default MessagesPage;
