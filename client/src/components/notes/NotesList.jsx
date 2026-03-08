import NoteCard from './NoteCard';
import styles from './NotesList.module.css';

function NotesList({
  notes,
  onDelete,
  onUpdate,
  deletingId,
  emptyMessage = 'Aún no hay notas.',
}) {
  if (!notes.length) {
    return (
      <div className={styles.empty}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDelete}
          onUpdate={onUpdate}
          deleting={deletingId === note.id}
        />
      ))}
    </div>
  );
}

export default NotesList;