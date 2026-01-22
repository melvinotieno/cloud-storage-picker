export interface FileData<RawFileData> {
  id: string;
  name: string;
  link: string;
  rawData: RawFileData;
}

export interface StorageProvider<Options, RawFileData> {
  open(options?: Options): Promise<FileData<RawFileData>[]>;
}
