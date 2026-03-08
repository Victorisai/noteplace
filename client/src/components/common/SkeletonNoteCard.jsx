import styles from './SkeletonNoteCard.module.css';

function SkeletonNoteCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar}></div>
        <div className={styles.userInfo}>
          <div className={styles.lineShort}></div>
          <div className={styles.lineTiny}></div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.line}></div>
        <div className={styles.line}></div>
        <div className={styles.lineMedium}></div>
      </div>
    </div>
  );
}

export default SkeletonNoteCard;