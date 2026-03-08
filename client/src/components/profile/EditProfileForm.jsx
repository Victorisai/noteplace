import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateMyProfile } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import useToast from '../../hooks/useToast';
import styles from './EditProfileForm.module.css';

function EditProfileForm() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
  });

  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);

      const previousUsername = user?.username;
      const data = await updateMyProfile(form);

      updateUser(data.user);
      showToast('Perfil actualizado correctamente', 'success');

      if (previousUsername !== data.user.username) {
        navigate(`/profile/${data.user.username}`, { replace: true });
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Editar perfil</h3>

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
          />
        </div>

        <div className={styles.fieldFull}>
          <label htmlFor="avatar_url">URL del avatar</label>
          <input
            id="avatar_url"
            name="avatar_url"
            type="text"
            placeholder="https://..."
            value={form.avatar_url}
            onChange={handleChange}
          />
        </div>

        <div className={styles.fieldFull}>
          <label htmlFor="bio">Biografía</label>
          <textarea
            id="bio"
            name="bio"
            rows="4"
            maxLength="255"
            value={form.bio}
            onChange={handleChange}
          />
        </div>
      </div>

      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}

export default EditProfileForm;