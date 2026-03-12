import styles from './Logo.module.css';
import { useTheme } from '../../hooks/useTheme';
import logoDark from '../../assets/logo_dark.png';
import logoLight from '../../assets/logo_light.png';

function Logo() {
  const { isDark } = useTheme();
  const logoSrc = isDark ? logoLight : logoDark;

  return (
    <div className={styles.logo}>
      <img className={styles.logoImage} src={logoSrc} alt="NotePlace" />
    </div>
  );
}

export default Logo;
