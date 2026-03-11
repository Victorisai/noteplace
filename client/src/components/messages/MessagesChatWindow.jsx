import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import {
  deleteActiveConversation,
  sendMessageFromComposer,
  selectActiveConversation,
  selectComposer,
  selectIsDeletingActiveConversation,
  selectIsPinningActiveConversation,
  selectMessages,
  selectMessagesLoading,
  selectSending,
  setActiveConversationId,
  setComposer,
  togglePinnedForActiveConversation,
} from '../../features/messages/messagesSlice';
import Avatar from '../ui/Avatar';
import styles from './MessagesChatWindow.module.css';

function formatTime(dateString) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function MessagesChatWindow({ isMobile }) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user } = useAuth();

  const activeConversation = useSelector(selectActiveConversation);
  const messages = useSelector(selectMessages);
  const messagesLoading = useSelector(selectMessagesLoading);
  const composer = useSelector(selectComposer);
  const sending = useSelector(selectSending);
  const isPinningConversation = useSelector(selectIsPinningActiveConversation);
  const isDeletingConversation = useSelector(selectIsDeletingActiveConversation);

  const currentUserId = user?.id;

  const messagesRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, activeConversation?.id]);

  useEffect(() => {
    if (!showDeleteModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || isDeletingConversation) return;
      setShowDeleteModal(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal, isDeletingConversation]);

  async function handleSendMessage(event) {
    event.preventDefault();

    try {
      await dispatch(sendMessageFromComposer());
    } catch (error) {
      showToast(error.message || 'No se pudo enviar el mensaje', 'error');
    }
  }

  async function handleTogglePinConversation() {
    try {
      const nextPinnedState = await dispatch(togglePinnedForActiveConversation());
      if (nextPinnedState === null) return;
      showToast(nextPinnedState ? 'Chat fijado' : 'Chat desfijado', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar el chat', 'error');
    }
  }

  async function handleConfirmDelete() {
    try {
      const deleted = await dispatch(deleteActiveConversation({ isMobile }));
      if (!deleted) return;
      setShowDeleteModal(false);
      showToast('Chat borrado correctamente', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo borrar el chat', 'error');
    }
  }

  function handleBack() {
    if (!isMobile) return;
    dispatch(setActiveConversationId(null));
  }

  return (
    <div className={styles.chat}>
      {!activeConversation ? (
        <div className={styles.emptyChat}>
          <h3>Selecciona un chat</h3>
          <p>Busca entre tus seguidos o elige una conversación para comenzar.</p>
        </div>
      ) : (
        <>
          <header className={styles.chatHeader}>
            <div className={styles.headerIdentity}>
              {isMobile ? (
                <button type="button" className={styles.backButton} onClick={handleBack} aria-label="Volver a chats">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14.5 6.5L9 12L14.5 17.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : null}

              <Avatar
                name={activeConversation.other_user?.name}
                avatarUrl={activeConversation.other_user?.avatar_url}
                size="sm"
              />
              <div>
                <p className={styles.userName}>{activeConversation.other_user?.name}</p>
                <p className={styles.userUsername}>@{activeConversation.other_user?.username}</p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.headerAction} ${activeConversation.is_pinned ? styles.headerActionPinned : ''}`}
                onClick={handleTogglePinConversation}
                disabled={isPinningConversation || isDeletingConversation}
                aria-label={activeConversation.is_pinned ? 'Desfijar chat' : 'Fijar chat'}
                aria-pressed={Boolean(activeConversation.is_pinned)}
                title={activeConversation.is_pinned ? 'Desfijar chat' : 'Fijar chat'}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7.5 3.75H16.5L14.25 9V14.25L12 15.75L9.75 14.25V9L7.5 3.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15.75V20.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>

              <button
                type="button"
                className={`${styles.headerAction} ${styles.headerActionDelete}`}
                onClick={() => setShowDeleteModal(true)}
                disabled={isPinningConversation || isDeletingConversation}
                aria-label="Borrar chat"
                title="Borrar chat"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4.5 7.5H19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M9.75 10.5V16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M14.25 10.5V16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M6.75 7.5L7.5 18.75C7.56 19.56 8.22 20.25 9.03 20.25H14.97C15.78 20.25 16.44 19.56 16.5 18.75L17.25 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 7.5V5.25C9 4.84 9.34 4.5 9.75 4.5H14.25C14.66 4.5 15 4.84 15 5.25V7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </header>

          <div ref={messagesRef} className={styles.messages}>
            {messagesLoading ? <p className={styles.state}>Cargando conversación...</p> : null}
            {!messagesLoading && !messages.length ? <p className={styles.state}>No hay mensajes todavía.</p> : null}

            {!messagesLoading && messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              return (
                <div key={message.id} className={`${styles.bubbleRow} ${isOwn ? styles.bubbleOwn : ''}`}>
                  <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwnColor : ''}`}>
                    <p>{message.content}</p>
                    <span>{formatTime(message.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <form className={styles.composer} onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={composer}
              onChange={(event) => dispatch(setComposer(event.target.value))}
              maxLength={1200}
            />
            <button type="submit" disabled={sending || !composer.trim()}>
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>

          {showDeleteModal ? (
            <div
              className={styles.modalOverlay}
              role="presentation"
              onClick={() => {
                if (isDeletingConversation) return;
                setShowDeleteModal(false);
              }}
            >
              <div
                className={styles.deleteModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-chat-title"
                aria-describedby="delete-chat-description"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 id="delete-chat-title">Borrar chat</h3>
                <p id="delete-chat-description">
                  ¿Seguro que quieres borrar esta conversación por completo? Esta acción no se puede deshacer.
                </p>
                <div className={styles.deleteModalActions}>
                  <button
                    type="button"
                    className={styles.deleteModalCancel}
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeletingConversation}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={styles.deleteModalConfirm}
                    onClick={handleConfirmDelete}
                    disabled={isDeletingConversation}
                  >
                    {isDeletingConversation ? 'Borrando...' : 'Sí, borrar chat'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default MessagesChatWindow;
