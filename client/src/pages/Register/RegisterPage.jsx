import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import useAuthRedirect from '../../hooks/useAuthRedirect';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useToast from '../../hooks/useToast';
import styles from './RegisterPage.module.css';

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  useDocumentTitle('Registro | NotePlace');
  useAuthRedirect('/feed');

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await registerUser(form);
      login(data.token, data.user);
      showToast('Cuenta creada correctamente', 'success');
      navigate('/feed');
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <h1>Crear cuenta</h1>
        <p className={styles.subtitle}>Únete a NotePlace y comparte tus ideas</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Tu nombre"
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
              placeholder="tu_usuario"
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="correo@mail.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className={styles.footerText}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </section>
  );
}

export default RegisterPage;