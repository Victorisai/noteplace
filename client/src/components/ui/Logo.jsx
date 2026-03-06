import styles from './Logo.module.css';
import logo from '../../assets/logo-noteplace.svg';

function Logo() {
  return (
    <div className={styles.logo}>
      <img src={logo} alt="NotePlace logo" />
    </div>
  );
}

export default Logo;