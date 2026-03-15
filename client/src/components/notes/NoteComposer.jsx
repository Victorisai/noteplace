import { useEffect, useId, useMemo, useRef, useState } from 'react';
import styles from './NoteComposer.module.css';

const MAX_CHARS = 280;
const MAX_IMAGES = 4;

function NoteComposer({ onSubmit, loading }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const fileInputId = useId();
  const fileInputRef = useRef(null);
  const remainingChars = useMemo(() => MAX_CHARS - content.length, [content]);
  const imagePreviews = useMemo(
    () => images.map((file) => ({ url: URL.createObjectURL(file), name: file.name })),
    [images],
  );

  useEffect(() => () => {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [imagePreviews]);

  function resetFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFilesChange(event) {
    setImages(Array.from(event.target.files || []).slice(0, MAX_IMAGES));
    resetFileInput();
  }

  function handleRemoveImage(indexToRemove) {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    resetFileInput();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > MAX_CHARS) return;

    const wasCreated = await onSubmit(trimmed, images);
    if (wasCreated) {
      setContent('');
      setImages([]);
      resetFileInput();
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
          <span>{images.length > 0 ? `${images.length} foto${images.length > 1 ? 's' : ''} seleccionada${images.length > 1 ? 's' : ''}` : `Agregar fotos (max. ${MAX_IMAGES})`}</span>
        </label>
        <input
          id={fileInputId}
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
        />
      </div>
      {imagePreviews.length > 0 ? (
        <div className={styles.previewSection}>
          <p className={styles.previewLabel}>Vista previa</p>
          <div className={styles.previewGrid}>
            {imagePreviews.map((preview, index) => (
              <div key={`${preview.name}-${index}`} className={styles.previewCard}>
                <img className={styles.previewImage} src={preview.url} alt={`Imagen seleccionada ${index + 1}`} />
                <button
                  type="button"
                  className={styles.removeImageButton}
                  onClick={() => handleRemoveImage(index)}
                  aria-label={`Quitar imagen ${index + 1}`}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
