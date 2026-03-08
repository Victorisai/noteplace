import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import useAuthRedirect from '../../hooks/useAuthRedirect';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useToast from '../../hooks/useToast';
import styles from './LoginPage.module.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  useDocumentTitle('Login | NotePlace');
  useAuthRedirect('/feed');

  const [form, setForm] = useState({
    emailOrUsername: '',
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
      const data = await loginUser(form);
      login(data.token, data.user);
      showToast(`Bienvenido, ${data.user.name}`, 'success');
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
        <h1>Iniciar sesión</h1>
        <p className={styles.subtitle}>Entra a tu cuenta de NotePlace</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="emailOrUsername">Correo o username</label>
            <input
              id="emailOrUsername"
              name="emailOrUsername"
              type="text"
              placeholder="ejemplo@mail.com o isai"
              value={form.emailOrUsername}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="******"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>

        <p className={styles.footerText}>
          ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </div>
    </section>
  );
}

export default LoginPage;