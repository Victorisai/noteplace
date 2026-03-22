import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useToast from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { toAbsoluteAssetUrl } from '../../services/api';
import {
  deleteActiveConversation,
  sendMessageFromComposer,
  selectActiveConversation,
  selectComposer,
  selectIsDeletingActiveConversation,
  selectIsPinningActiveConversation,
  selectMessages,
  selectMessagesLoading,
  selectSending,
  setActiveConversationId,
  setComposer,
  togglePinnedForActiveConversation,
} from '../../features/messages/messagesSlice';
import Avatar from '../ui/Avatar';
import styles from './MessagesChatWindow.module.css';

const NEAR_BOTTOM_THRESHOLD_PX = 72;
const MAX_COMPOSER_IMAGES = 4;

function formatTime(dateString) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function MessagesChatWindow({ isMobile }) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user } = useAuth();

  const activeConversation = useSelector(selectActiveConversation);
  const messages = useSelector(selectMessages);
  const messagesLoading = useSelector(selectMessagesLoading);
  const composer = useSelector(selectComposer);
  const sending = useSelector(selectSending);
  const isPinningConversation = useSelector(selectIsPinningActiveConversation);
  const isDeletingConversation = useSelector(selectIsDeletingActiveConversation);

  const currentUserId = user?.id;
  const activeConversationId = activeConversation?.id || null;

  const messagesRef = useRef(null);
  const composerInputRef = useRef(null);
  const composerFileInputRef = useRef(null);
  const keyboardScrollRafRef = useRef(null);
  const settleScrollTimeoutRef = useRef(null);
  const keepBottomUntilRef = useRef(0);
  const composerFileInputId = useId();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState('');
  const [selectedImagesState, setSelectedImagesState] = useState({
    conversationId: null,
    files: [],
  });
  const selectedImages = useMemo(
    () => (selectedImagesState.conversationId === activeConversationId
      ? selectedImagesState.files
      : []),
    [selectedImagesState, activeConversationId],
  );
  const hasComposerText = composer.trim().length > 0;
  const shouldShowAttachButton = selectedImages.length > 0 || !hasComposerText;
  const imagePreviews = useMemo(
    () => selectedImages.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}`,
      previewUrl: URL.createObjectURL(file),
    })),
    [selectedImages],
  );

  function scrollMessagesToBottom() {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }

  useEffect(() => {
    keepBottomUntilRef.current = Date.now() + 3000;
  }, [activeConversationId]);

  useLayoutEffect(() => {
    scrollMessagesToBottom();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollMessagesToBottom();
      });
    });

    if (settleScrollTimeoutRef.current) {
      window.clearTimeout(settleScrollTimeoutRef.current);
    }
    settleScrollTimeoutRef.current = window.setTimeout(() => {
      scrollMessagesToBottom();
      settleScrollTimeoutRef.current = null;
    }, 180);
  }, [messages, activeConversation?.id]);

  useEffect(() => () => {
    if (settleScrollTimeoutRef.current) {
      window.clearTimeout(settleScrollTimeoutRef.current);
      settleScrollTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isMobile || !activeConversation?.id) return undefined;

    const handleViewportChange = () => {
      const container = messagesRef.current;
      const composerInput = composerInputRef.current;
      if (!container || !composerInput) return;

      const isComposerFocused = document.activeElement === composerInput;
      const shouldKeepBottom = Date.now() < keepBottomUntilRef.current;
      const nearBottomBeforeResize =
        (container.scrollHeight - (container.scrollTop + container.clientHeight)) <= NEAR_BOTTOM_THRESHOLD_PX;

      if (!isComposerFocused && !shouldKeepBottom && !nearBottomBeforeResize) return;

      if (keyboardScrollRafRef.current) {
        window.cancelAnimationFrame(keyboardScrollRafRef.current);
      }

      keyboardScrollRafRef.current = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const nextContainer = messagesRef.current;
          if (!nextContainer) return;

          nextContainer.scrollTo({
            top: nextContainer.scrollHeight,
            behavior: 'auto',
          });
          keyboardScrollRafRef.current = null;
        });
      });
    };

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener('resize', handleViewportChange);
    visualViewport?.addEventListener('scroll', handleViewportChange);

    return () => {
      visualViewport?.removeEventListener('resize', handleViewportChange);
      visualViewport?.removeEventListener('scroll', handleViewportChange);
      if (keyboardScrollRafRef.current) {
        window.cancelAnimationFrame(keyboardScrollRafRef.current);
        keyboardScrollRafRef.current = null;
      }
    };
  }, [isMobile, activeConversation?.id]);

  function handleComposerFocus() {
    const container = messagesRef.current;
    if (!container) return;
    keepBottomUntilRef.current = Date.now() + 2000;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'auto',
    });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const nextContainer = messagesRef.current;
        if (!nextContainer) return;
        nextContainer.scrollTo({
          top: nextContainer.scrollHeight,
          behavior: 'auto',
        });
      });
    });
  }

  function handleComposerBlur() {
    keepBottomUntilRef.current = Date.now() + 700;
  }

  function handleMessageMediaLoad() {
    const container = messagesRef.current;
    if (!container) return;

    const nearBottom =
      (container.scrollHeight - (container.scrollTop + container.clientHeight)) <= NEAR_BOTTOM_THRESHOLD_PX;
    const shouldKeepBottom = Date.now() < keepBottomUntilRef.current;

    if (!nearBottom && !shouldKeepBottom) return;
    scrollMessagesToBottom();
  }

  useEffect(() => {
    if (!showDeleteModal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' || isDeletingConversation) return;
      setShowDeleteModal(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal, isDeletingConversation]);

  useEffect(() => {
    if (!previewImageSrc) return undefined;

    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setPreviewImageSrc('');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewImageSrc]);

  useEffect(() => () => {
    imagePreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, [imagePreviews]);

  useEffect(() => {
    if (composerFileInputRef.current) {
      composerFileInputRef.current.value = '';
    }
  }, [activeConversationId]);

  function resetComposerFileInput() {
    if (composerFileInputRef.current) {
      composerFileInputRef.current.value = '';
    }
  }

  function handleSelectImages(event) {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) return;

    setSelectedImagesState((previousState) => {
      const previousFiles = previousState.conversationId === activeConversationId
        ? previousState.files
        : [];
      const availableSlots = Math.max(0, MAX_COMPOSER_IMAGES - previousFiles.length);
      if (!availableSlots) {
        showToast(`Solo puedes enviar hasta ${MAX_COMPOSER_IMAGES} fotos por mensaje`, 'error');
        return previousState;
      }

      const acceptedFiles = incomingFiles.slice(0, availableSlots);
      if (incomingFiles.length > availableSlots) {
        showToast(`Solo se agregaron ${availableSlots} foto(s) para respetar el límite`, 'info');
      }

      return {
        conversationId: activeConversationId,
        files: [...previousFiles, ...acceptedFiles],
      };
    });

    resetComposerFileInput();
  }

  function handleRemoveSelectedImage(indexToRemove) {
    setSelectedImagesState({
      conversationId: activeConversationId,
      files: selectedImages.filter((_, index) => index !== indexToRemove),
    });
    resetComposerFileInput();
  }

  function handleOpenImagePicker() {
    composerFileInputRef.current?.click();
  }

  function handleOpenImagePreview(imageUrl) {
    const absoluteImageUrl = toAbsoluteAssetUrl(imageUrl);
    if (!absoluteImageUrl) return;
    setPreviewImageSrc(absoluteImageUrl);
  }

  function handleCloseImagePreview() {
    setPreviewImageSrc('');
  }

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedComposer = composer.trim();
    if (!trimmedComposer && !selectedImages.length) return;
    keepBottomUntilRef.current = Date.now() + 2600;

    let sentImagesCount = 0;
    let sentComposerText = false;

    try {
      if (selectedImages.length) {
        for (let index = 0; index < selectedImages.length; index += 1) {
          const imageFile = selectedImages[index];
          const content = index === 0 ? trimmedComposer : '';

          const sentMessage = await dispatch(sendMessageFromComposer({ content, imageFile }));
          if (!sentMessage) continue;

          sentImagesCount += 1;
          if (content) sentComposerText = true;
        }

        if (sentImagesCount) {
          setSelectedImagesState({
            conversationId: activeConversationId,
            files: selectedImages.slice(sentImagesCount),
          });
        }

        if (sentComposerText) {
          dispatch(setComposer(''));
        }

        resetComposerFileInput();
      } else {
        await dispatch(sendMessageFromComposer());
      }

      scrollMessagesToBottom();
      window.requestAnimationFrame(() => {
        scrollMessagesToBottom();
      });
    } catch (error) {
      if (sentImagesCount) {
        setSelectedImagesState({
          conversationId: activeConversationId,
          files: selectedImages.slice(sentImagesCount),
        });
      }
      if (sentComposerText) {
        dispatch(setComposer(''));
      }
      resetComposerFileInput();
      keepBottomUntilRef.current = Date.now() + 1200;
      showToast(error.message || 'No se pudo enviar el mensaje', 'error');
    }
  }

  async function handleTogglePinConversation() {
    try {
      const nextPinnedState = await dispatch(togglePinnedForActiveConversation());
      if (nextPinnedState === null) return;
      showToast(nextPinnedState ? 'Chat fijado' : 'Chat desfijado', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar el chat', 'error');
    }
  }

  async function handleConfirmDelete() {
    try {
      const deleted = await dispatch(deleteActiveConversation({ isMobile }));
      if (!deleted) return;
      setShowDeleteModal(false);
      showToast('Chat borrado correctamente', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo borrar el chat', 'error');
    }
  }

  function handleBack() {
    if (!isMobile) return;
    dispatch(setActiveConversationId(null));
  }

  return (
    <div className={styles.chat}>
      {!activeConversation ? (
        <div className={styles.emptyChat}>
          <h3>Selecciona un chat</h3>
          <p>Busca entre tus seguidos o elige una conversación para comenzar.</p>
        </div>
      ) : (
        <>
          <header className={styles.chatHeader}>
            <div className={styles.headerIdentity}>
              {isMobile ? (
                <button type="button" className={styles.backButton} onClick={handleBack} aria-label="Volver a chats">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14.5 6.5L9 12L14.5 17.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : null}

              <Avatar
                name={activeConversation.other_user?.name}
                avatarUrl={activeConversation.other_user?.avatar_url}
                size="sm"
              />
              <div>
                <p className={styles.userName}>{activeConversation.other_user?.name}</p>
                <p className={styles.userUsername}>@{activeConversation.other_user?.username}</p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={`${styles.headerAction} ${activeConversation.is_pinned ? styles.headerActionPinned : ''}`}
                onClick={handleTogglePinConversation}
                disabled={isPinningConversation || isDeletingConversation}
                aria-label={activeConversation.is_pinned ? 'Desfijar chat' : 'Fijar chat'}
                aria-pressed={Boolean(activeConversation.is_pinned)}
                title={activeConversation.is_pinned ? 'Desfijar chat' : 'Fijar chat'}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7.5 3.75H16.5L14.25 9V14.25L12 15.75L9.75 14.25V9L7.5 3.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15.75V20.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>

              <button
                type="button"
                className={`${styles.headerAction} ${styles.headerActionDelete}`}
                onClick={() => setShowDeleteModal(true)}
                disabled={isPinningConversation || isDeletingConversation}
                aria-label="Borrar chat"
                title="Borrar chat"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4.5 7.5H19.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M9.75 10.5V16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M14.25 10.5V16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  <path d="M6.75 7.5L7.5 18.75C7.56 19.56 8.22 20.25 9.03 20.25H14.97C15.78 20.25 16.44 19.56 16.5 18.75L17.25 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 7.5V5.25C9 4.84 9.34 4.5 9.75 4.5H14.25C14.66 4.5 15 4.84 15 5.25V7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </header>

          <div ref={messagesRef} className={styles.messages}>
            {messagesLoading ? <p className={styles.state}>Cargando conversación...</p> : null}
            {!messagesLoading && !messages.length ? <p className={styles.state}>No hay mensajes todavía.</p> : null}

            {!messagesLoading && messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              const messageText = String(message.content || '').trim();
              const hasImage = Boolean(message.image_url);

              if (hasImage) {
                return (
                  <div key={message.id} className={`${styles.bubbleRow} ${isOwn ? styles.bubbleOwn : ''}`}>
                    <div className={styles.mediaMessage}>
                      <button
                        type="button"
                        className={styles.mediaImageButton}
                        onClick={() => handleOpenImagePreview(message.image_url)}
                        aria-label="Ver imagen en vista previa"
                      >
                        <img
                          className={styles.bubbleImage}
                          src={toAbsoluteAssetUrl(message.image_url)}
                          alt="Imagen compartida en el chat"
                          loading="lazy"
                          onLoad={handleMessageMediaLoad}
                          onError={handleMessageMediaLoad}
                        />
                      </button>
                      {messageText ? (
                        <p className={`${styles.mediaCaption} ${isOwn ? styles.mediaCaptionOwn : ''}`}>
                          {messageText}
                        </p>
                      ) : null}
                      <span className={styles.mediaTime}>{formatTime(message.created_at)}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className={`${styles.bubbleRow} ${isOwn ? styles.bubbleOwn : ''}`}>
                  <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwnColor : ''}`}>
                    <p>{messageText}</p>
                    <span>{formatTime(message.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <form className={styles.composer} onSubmit={handleSendMessage}>
            {imagePreviews.length ? (
              <div className={styles.composerMediaPreview} aria-live="polite">
                {imagePreviews.map((item, index) => (
                  <div key={`${item.key}-${index}`} className={styles.composerMediaCard}>
                    <img src={item.previewUrl} alt={`Foto seleccionada ${index + 1}`} />
                    <button
                      type="button"
                      className={styles.composerMediaRemove}
                      onClick={() => handleRemoveSelectedImage(index)}
                      aria-label={`Quitar foto ${index + 1}`}
                      disabled={sending}
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className={styles.composerRow}>
              <input
                ref={composerInputRef}
                type="text"
                placeholder="Escribe un mensaje..."
                value={composer}
                onChange={(event) => dispatch(setComposer(event.target.value))}
                onFocus={handleComposerFocus}
                onBlur={handleComposerBlur}
                maxLength={1200}
              />

              {shouldShowAttachButton ? (
                <button
                  type="button"
                  className={styles.attachButton}
                  onClick={handleOpenImagePicker}
                  aria-label="Agregar fotos"
                  title="Agregar fotos"
                  disabled={sending || selectedImages.length >= MAX_COMPOSER_IMAGES}
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4.75 7.5C4.75 6.12 5.87 5 7.25 5H16.75C18.13 5 19.25 6.12 19.25 7.5V16.5C19.25 17.88 18.13 19 16.75 19H7.25C5.87 19 4.75 17.88 4.75 16.5V7.5Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 14.25L10.3 11.95C10.7 11.55 11.35 11.55 11.75 11.95L14 14.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.35 13.55L13.95 12.95C14.35 12.55 15 12.55 15.4 12.95L16.75 14.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="9.25" cy="9.1" r="1.15" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                  {selectedImages.length ? (
                    <span>{selectedImages.length}</span>
                  ) : null}
                </button>
              ) : null}

              <input
                id={composerFileInputId}
                ref={composerFileInputRef}
                className={styles.fileInput}
                type="file"
                accept="image/*"
                multiple
                onChange={handleSelectImages}
              />

              <button type="submit" disabled={sending || (!hasComposerText && !selectedImages.length)}>
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>

          {previewImageSrc ? (
            <div className={styles.imagePreviewOverlay} role="presentation" onClick={handleCloseImagePreview}>
              <div
                className={styles.imagePreviewDialog}
                role="dialog"
                aria-modal="true"
                aria-label="Vista previa de imagen"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className={styles.imagePreviewClose}
                  onClick={handleCloseImagePreview}
                  aria-label="Cerrar vista previa"
                >
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 7L17 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    <path d="M17 7L7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                  </svg>
                </button>
                <img
                  className={styles.imagePreviewImage}
                  src={previewImageSrc}
                  alt="Vista previa de imagen enviada"
                />
              </div>
            </div>
          ) : null}

          {showDeleteModal ? (
            <div
              className={styles.modalOverlay}
              role="presentation"
              onClick={() => {
                if (isDeletingConversation) return;
                setShowDeleteModal(false);
              }}
            >
              <div
                className={styles.deleteModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-chat-title"
                aria-describedby="delete-chat-description"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 id="delete-chat-title">Borrar chat</h3>
                <p id="delete-chat-description">
                  ¿Seguro que quieres borrar esta conversación por completo? Esta acción no se puede deshacer.
                </p>
                <div className={styles.deleteModalActions}>
                  <button
                    type="button"
                    className={styles.deleteModalCancel}
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeletingConversation}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className={styles.deleteModalConfirm}
                    onClick={handleConfirmDelete}
                    disabled={isDeletingConversation}
                  >
                    {isDeletingConversation ? 'Borrando...' : 'Sí, borrar chat'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default MessagesChatWindow;
