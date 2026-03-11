import Avatar from '../ui/Avatar';
import styles from './MessagesSidebar.module.css';

function formatConversationTime(dateString) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

function MessagesSidebar({
  search,
  onSearchChange,
  searchingUsers,
  searchUsers,
  onOpenConversation,
  conversations,
  activeConversationId,
  onSelectConversation,
}) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.searchBox}>
        <input
          type="text"
          value={search}
          className={styles.searchInput}
          placeholder="Buscar entre seguidos..."
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      {search.trim() ? (
        <div className={styles.searchResults}>
          <p className={styles.sectionTitle}>Resultados</p>
          {searchingUsers ? <p className={styles.state}>Buscando...</p> : null}
          {!searchingUsers && !searchUsers.length ? <p className={styles.state}>Sin resultados</p> : null}
          <ul className={styles.userList}>
            {searchUsers.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={styles.userButton}
                  onClick={() => onOpenConversation(item)}
                >
                  <Avatar name={item.name} avatarUrl={item.avatar_url} size="sm" />
                  <div>
                    <p className={styles.userName}>{item.name}</p>
                    <p className={styles.userUsername}>@{item.username}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.conversationWrap}>
        <p className={styles.sectionTitle}>Chats</p>
        {!conversations.length ? <p className={styles.state}>Aún no tienes conversaciones.</p> : null}
        <ul className={styles.conversationList}>
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className={`${styles.conversationItem} ${activeConversationId === conversation.id ? styles.conversationItemActive : ''}`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <Avatar
                  name={conversation.other_user?.name}
                  avatarUrl={conversation.other_user?.avatar_url}
                  size="sm"
                />
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationHeader}>
                    <div className={styles.nameWrap}>
                      <p className={styles.userName}>{conversation.other_user?.name}</p>
                      {conversation.is_pinned ? (
                        <span className={styles.pinnedTag} title="Chat fijado" aria-label="Chat fijado">
                          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M7.5 3.75H16.5L14.25 9V14.25L12 15.75L9.75 14.25V9L7.5 3.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 15.75V20.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                          </svg>
                        </span>
                      ) : null}
                    </div>
                    <span>{conversation.last_message?.created_at ? formatConversationTime(conversation.last_message.created_at) : ''}</span>
                  </div>
                  <p className={styles.lastMessage}>
                    {conversation.last_message?.content || 'Inicia una conversación'}
                  </p>
                </div>
                {conversation.unread_count > 0 ? (
                  <span className={styles.unreadBadge}>{conversation.unread_count}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default MessagesSidebar;
