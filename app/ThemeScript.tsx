// We inject the theme script to prevent flash of white when the page loads
const ThemeScript = () => {
  const themeScript = `
    (function() {
      const storedTheme = localStorage.getItem('theme')
      if (storedTheme === '"light"') return;
      if (storedTheme === '"dark"' || window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      }
    })()
  `;

  // biome-ignore lint/security/noDangerouslySetInnerHtml: the theme script only works with dangerouslySetInnerHTML
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};

export default ThemeScript;
