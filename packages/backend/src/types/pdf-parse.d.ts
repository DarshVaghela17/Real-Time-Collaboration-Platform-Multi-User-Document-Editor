declare module 'pdf-parse' {
  function pdfParse(dataBuffer: Buffer): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }>;

  export = pdfParse;
}
