const ThemeScript = () => {
  const themeScript = `
            (function() {
              function getInitialTheme() {
                const storedTheme = localStorage.getItem('theme')
                if (storedTheme === 'dark' || storedTheme === 'light') {
                  return storedTheme
                }
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
              }
              
              const theme = getInitialTheme()
              document.documentElement.classList.add(theme)
              localStorage.setItem('theme', theme)
            })()
          `;

  // not sure about this, but the idea is to inject this themescript
  // before the page even loads, it helps with performance

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};

export default ThemeScript;
