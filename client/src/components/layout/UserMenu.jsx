import { useEffect, useRef, useState } from 'react';
import UserSideMenu from './UserSideMenu';
import styles from './UserMenu.module.css';

function UserMenu({ user, notesCount = 0, onLogout, onOpenSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuContainerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerOutside(event) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside);

    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside);
    };
  }, [isOpen]);

  if (!user) return null;

  return (
    <div className={styles.wrapper} ref={menuContainerRef}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="user-side-menu"
        aria-label="Abrir menú de usuario"
      >
        <span className={styles.line}></span>
        <span className={styles.line}></span>
        <span className={styles.line}></span>
      </button>

      <UserSideMenu
        isOpen={isOpen}
        user={user}
        notesCount={notesCount}
        onClose={() => setIsOpen(false)}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
}

export default UserMenu;
