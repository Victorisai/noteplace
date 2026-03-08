import styles from './Avatar.module.css';

function Avatar({ name = 'User', avatarUrl = '', size = 'md' }) {
  const initial = name?.charAt(0)?.toUpperCase() || 'N';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${styles.avatar} ${styles[size]}`}
      />
    );
  }

  return (
    <div className={`${styles.avatarFallback} ${styles[size]}`}>
      {initial}
    </div>
  );
}

export default Avatar;