// We inject the theme script to prevent flash of white when the page loads
const ThemeScript = () => {
  const themeScript = `
    (function() {
      const storedTheme = localStorage.getItem('mini-app-theme');
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        return;
      }
      if (storedTheme === 'light') return;
      if (storedTheme === 'system' || !storedTheme) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    })()
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};

export default ThemeScript;