import type { FileData, StorageProvider } from "@/picker/types";

export interface GoogleDriveConfig {
  /**
   * OAuth 2.0 Client ID for Google Drive API.
   */
  clientId: string;
  /**
   * API Key for Google Drive API.
   */
  apiKey: string;
}

export interface GoogleDriveOptions {
  /**
   * Sets the maximum number of items a user can pick.
   */
  maxItems?: number;
}

export interface GoogleDriveFileData {
  /**
   * Unique ID for the file.
   */
  id: string;
  /**
   * The name of the file.
   */
  name: string;
  /**
   * The MIME type of the file.
   */
  mimeType: string;
  /**
   * The URL of the file.
   */
  url: string;
}

export type GoogleDriveProvider = (
  config: GoogleDriveConfig,
  options?: GoogleDriveOptions,
) => StorageProvider<GoogleDriveOptions, GoogleDriveFileData>;

export const googleDriveProvider: GoogleDriveProvider = (config, options) => {
  return {
    open: async (opts = {}) => {
      await loadGoogleApis();

      const token = await getAccessToken(config.clientId);

      const finalOptions = { ...options, ...opts };

      return new Promise<FileData<GoogleDriveFileData>[]>((resolve, reject) => {
        const pickerCallback = (data: google.picker.ResponseObject) => {
          const action = data[google.picker.Response.ACTION];

          if (action === google.picker.Action.PICKED) {
            const files = data[google.picker.Response.DOCUMENTS]?.map((doc) => {
              return {
                id: doc[google.picker.Document.ID],
                name: doc[google.picker.Document.NAME]!,
                link: doc[google.picker.Document.URL]!,
                rawData: {
                  id: doc[google.picker.Document.ID],
                  name: doc[google.picker.Document.NAME]!,
                  mimeType: doc[google.picker.Document.MIME_TYPE]!,
                  url: doc[google.picker.Document.URL]!,
                },
              };
            });

            return resolve(files ?? []);
          }

          if (action === google.picker.Action.CANCEL) {
            return reject(new Error("User cancelled Google Drive picker"));
          }

          if (action === google.picker.Action.ERROR) {
            return reject(new Error("Error occurred in Google Drive picker"));
          }
        };

        const picker = new window.google.picker.PickerBuilder()
          .addView(window.google.picker.ViewId.DOCS)
          .setOAuthToken(token)
          .setDeveloperKey(config.apiKey)
          .setCallback(pickerCallback);

        if (finalOptions.maxItems) {
          picker.setMaxItems(finalOptions.maxItems);
        }

        picker.build().setVisible(true);
      });
    },
  };
};

function getAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (response: any) => {
        if (response.access_token) {
          resolve(response.access_token);
        } else {
          reject(new Error("Failed to get access token"));
        }
      },
    });

    tokenClient.requestAccessToken();
  });
}

async function loadGoogleApis(): Promise<void> {
  if (window.gapi && window.google) return;

  await loadScript("https://apis.google.com/js/api.js");
  await loadScript("https://accounts.google.com/gsi/client");

  await new Promise<void>((resolve) => {
    window.gapi.load("client:picker", resolve);
  });
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
