export function dynamicImport<T>(modulePath: string, exportName: keyof T) {
  return () => import(modulePath).then((mod) => mod[exportName] as T[keyof T]);
}
