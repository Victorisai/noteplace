import { useMemo, useState } from 'react';
import styles from './NoteComposer.module.css';

const MAX_CHARS = 280;

function NoteComposer({ onSubmit, loading }) {
  const [content, setContent] = useState('');

  const remainingChars = useMemo(() => MAX_CHARS - content.length, [content]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed || trimmed.length > MAX_CHARS) {
      return;
    }

    const wasCreated = await onSubmit(trimmed);

    if (wasCreated) {
      setContent('');
    }
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        placeholder="¿Qué estás pensando?"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={MAX_CHARS}
      />

      <div className={styles.footer}>
        <span
          className={`${styles.counter} ${
            remainingChars <= 20 ? styles.counterWarning : ''
          }`}
        >
          {remainingChars} caracteres restantes
        </span>

        <button
          className={styles.button}
          type="submit"
          disabled={loading || !content.trim()}
        >
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}

export default NoteComposer;