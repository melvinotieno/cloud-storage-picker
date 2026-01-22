import type { FileData, StorageProvider } from "./types";

interface ChooserParams<Options, RawFileData> {
  provider: StorageProvider<Options, RawFileData>;
}

/**
 * Creates a file chooser for a given storage provider.
 *
 * @param params - Object containing the storage provider implementation.
 * @returns An object with an `open` method that delegates to the provider.
 *
 * @example
 * const chooser = createChooser({
 *    provider: dropboxProvider({ appKey: "your-app-key" })
 * });
 *
 * const files = await chooser.open({ multiple: true });
 */
export function createChooser<O, R>(params: ChooserParams<O, R>) {
  return {
    open: async (options?: O): Promise<FileData<R>[]> => {
      return params.provider.open(options);
    },
  };
}
