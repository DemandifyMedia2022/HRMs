// PDFMake type definitions for better TypeScript support
 
interface TDocumentDefinitions {
  content: any[]
  pageSize?: string | { width: number; height: number }
  pageMargins?: number | [number, number] | [number, number, number, number]
  styles?: { [key: string]: any }
  defaultStyle?: any
  header?: any
  footer?: any
  background?: any
  images?: { [key: string]: string }
  watermark?: any
}
 
interface TPdfMakeInstance {
  vfs: any
  createPdf(documentDefinition: TDocumentDefinitions): {
    download(filename?: string): void
    open(): void
    getBlob(callback: (blob: Blob) => void): void
    getDataUrl(callback: (dataUrl: string) => void): void
  }
}
 
declare module 'pdfmake/build/pdfmake' {
  const pdfMake: TPdfMakeInstance
  export default pdfMake
}
 
declare module 'pdfmake/build/vfs_fonts' {
  export const vfs: any
  export const pdfMake: { vfs: any }
  const _default: { pdfMake: { vfs: any } }
  export default _default
}
 
// Fallback module declarations for Turbopack/Next resolution variants
declare module 'pdfmake/build/vfs_fonts.js' {
  export const vfs: any
  export const pdfMake: { vfs: any }
  const _default: { pdfMake: { vfs: any } }
  export default _default
}
 
declare module 'pdfmake/build/vfs_fonts.min.js' {
  export const vfs: any
  export const pdfMake: { vfs: any }
  const _default: { pdfMake: { vfs: any } }
  export default _default
}
 
// Declaration for the minified pdfmake build used in browser
declare module 'pdfmake/build/pdfmake.min.js' {
  const pdfMake: TPdfMakeInstance
  export default pdfMake
}
 
// Global window type extension
declare global {
  interface Window {
    pdfMake?: TPdfMakeInstance
  }
}