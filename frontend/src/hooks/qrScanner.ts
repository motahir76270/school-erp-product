import { Html5Qrcode } from "html5-qrcode";

let scanner: Html5Qrcode | null = null;

export const openQrScanner = async (
  elementId: string = "reader"
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      scanner = new Html5Qrcode(elementId);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
        },
        async (decodedText) => {
          await scanner?.stop();
          await scanner?.clear();

          resolve(decodedText);
        },
        () => {
          // Ignore scan errors while searching
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

export const closeQrScanner = async () => {
  if (scanner) {
    await scanner.stop().catch(() => {});
    await scanner.clear();
    scanner = null;
  }
};