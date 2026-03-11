import { useEffect, useRef } from 'react';
import Avatar from '../ui/Avatar';
import styles from './MessagesChatWindow.module.css';

function formatTime(dateString) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function MessagesChatWindow({
  activeConversation,
  messages,
  messagesLoading,
  currentUserId,
  composer,
  sending,
  isMobile,
  onBack,
  onComposerChange,
  onSendMessage,
}) {
  const messagesRef = useRef(null);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, activeConversation?.id]);

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
            {isMobile ? (
              <button type="button" className={styles.backButton} onClick={onBack} aria-label="Volver a chats">
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

          <form className={styles.composer} onSubmit={onSendMessage}>
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={composer}
              onChange={(event) => onComposerChange(event.target.value)}
              maxLength={1200}
            />
            <button type="submit" disabled={sending || !composer.trim()}>
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default MessagesChatWindow;
