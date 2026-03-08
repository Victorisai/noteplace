import { useState } from 'react';
import styles from './CommentComposer.module.css';

function CommentComposer({ onSubmit, loading }) {
  const [content, setContent] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!content.trim()) return;

    const ok = await onSubmit(content.trim());

    if (ok) {
      setContent('');
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        className={styles.textarea}
        rows="3"
        maxLength="280"
        placeholder="Escribe una respuesta..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Enviando...' : 'Responder'}
      </button>
    </form>
  );
}

export default CommentComposer;