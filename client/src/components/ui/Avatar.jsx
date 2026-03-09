import styles from './Avatar.module.css';
import { toAbsoluteAssetUrl } from '../../services/api';

function Avatar({ name = 'User', avatarUrl = '', size = 'md' }) {
  const initial = name?.charAt(0)?.toUpperCase() || 'N';
  const normalizedAvatarUrl = toAbsoluteAssetUrl(avatarUrl);

  if (normalizedAvatarUrl) {
    return (
      <img
        src={normalizedAvatarUrl}
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
