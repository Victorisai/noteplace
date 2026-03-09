import { useId, useMemo, useState } from 'react';
import styles from './NoteComposer.module.css';

const MAX_CHARS = 280;

function NoteComposer({ onSubmit, loading }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const fileInputId = useId();
  const remainingChars = useMemo(() => MAX_CHARS - content.length, [content]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;

    const wasCreated = await onSubmit(trimmed, images);
    if (wasCreated) {
      setContent('');
      setImages([]);
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

      <div className={styles.mediaRow}>
        <label className={styles.uploadButton} htmlFor={fileInputId}>
          <svg
            className={styles.uploadIcon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M12 16V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8.5 11.5L12 8L15.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 19H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="3.25" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <span>{images.length > 0 ? `${images.length} foto${images.length > 1 ? 's' : ''} seleccionada${images.length > 1 ? 's' : ''}` : 'Agregar fotos (máx. 4)'}</span>
        </label>
        <input
          id={fileInputId}
          className={styles.fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setImages(Array.from(event.target.files || []).slice(0, 4))}
        />
      </div>

      <div className={styles.footer}>
        <span className={`${styles.counter} ${remainingChars <= 20 ? styles.counterWarning : ''}`}>
          {remainingChars} caracteres restantes
        </span>

        <button className={styles.button} type="submit" disabled={loading || !content.trim()}>
          {loading ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}

export default NoteComposer;
