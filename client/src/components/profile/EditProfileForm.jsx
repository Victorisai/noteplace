import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateMyProfile, uploadMyAvatar } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import useToast from '../../hooks/useToast';
import styles from './EditProfileForm.module.css';

function EditProfileForm({ onSaved, onCancel, showTitle = true }) {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: user?.name || '', username: user?.username || '', bio: user?.bio || '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setLoading(true);
      const previousUsername = user?.username;
      let currentUser = (await updateMyProfile(form)).user;

      if (avatarFile) {
        currentUser = (await uploadMyAvatar(avatarFile)).user;
      }

      updateUser(currentUser);
      onSaved?.(currentUser);
      if (previousUsername !== currentUser.username) navigate(`/profile/${currentUser.username}`, { replace: true });
      showToast('Perfil actualizado correctamente', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {showTitle ? <h3 className={styles.title}>Editar perfil</h3> : null}
      <div className={styles.grid}>
        <div className={styles.field}><label htmlFor="name">Nombre</label><input id="name" name="name" type="text" value={form.name} onChange={handleChange} /></div>
        <div className={styles.field}><label htmlFor="username">Username</label><input id="username" name="username" type="text" value={form.username} onChange={handleChange} /></div>
        <div className={styles.fieldFull}><label htmlFor="avatar">Avatar</label><input id="avatar" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} /></div>
        <div className={styles.fieldFull}><label htmlFor="bio">Biografía</label><textarea id="bio" name="bio" rows="4" maxLength="255" value={form.bio} onChange={handleChange} /></div>
      </div>
      <div className={styles.actions}>
        {onCancel ? <button className={styles.secondaryButton} type="button" onClick={onCancel} disabled={loading}>Cancelar</button> : null}
        <button className={styles.button} type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>
    </form>
  );
}

export default EditProfileForm;
