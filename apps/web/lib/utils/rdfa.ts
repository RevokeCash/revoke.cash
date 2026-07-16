// Turbopack's JSX transform renames the RDFa `typeof` attribute to `typeOf` (an obsolete React DOM
// alias), which React 19 rejects with an "Invalid DOM property `typeOf`" warning on every page that
// renders it. Passing the attribute through an object spread bypasses the JSX attribute transform,
// so the lowercase `typeof` name reaches React unchanged: <div {...rdfaTypeof('Article')} />.
export const rdfaTypeof = (value: string) => ({ typeof: value });
