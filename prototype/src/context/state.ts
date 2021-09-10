import LZUTF8 from "lzutf8";
import { decode, encode } from 'url-safe-base64';
const url = require('url-parameters').default;

////////////////////////////////        Saving and Loading State      /////////////////////////////////////

export const LOCAL_STORAGE_KEY = "saved_code";

url.enable();
function compressCode(alg: string, enc: string, code: string): string {
  if (alg === "LZUTF8") {
    if (enc === "Base64") {
      return encode(LZUTF8.compress(code, { outputEncoding: "Base64" }).toString());
    }
  }
  throw Error("Unsupported compression algorithm or encoding")
}
function decompressCode(alg: string, enc: string, compressed_code: string): string {
  if (alg === "LZUTF8") {
    if (enc === "Base64") {
      return LZUTF8.decompress(decode(compressed_code), { inputEncoding: "Base64" }).toString();
    }
  }
  throw Error("Unsupported compression algorithm or encoding")
}
export function addToUrl(code: string, id: string | undefined = undefined) {
  const LENGTH_LIMIT = 1900; // 2000 limit minus base url
  if (id !== undefined) url.set('id', id)
  try {
    let compressed = compressCode("LZUTF8", "Base64", code)
    if (compressed.length > LENGTH_LIMIT) {
      // try removing empty lines (ignore lines with : or tab)
      let stripped_code = code.split("\n")
        .map(i => (i.includes(":") || i.includes("\t")) ? i : i.trim()) // trim non indented/property lines
        .filter(i => i.length).join("\n"); // remove empty lines
      compressed = compressCode("LZUTF8", "Base64", stripped_code)
    };
    if (compressed.length > LENGTH_LIMIT) {
      // Too large to put in url
      console.log("code is too long for url");
      url.remove("comp_alg")
      url.remove('comp_enc')
      url.remove('comp_code')
      return;
    }
    // console.log("setting compressed", compressed)
    url.set('comp_alg', 'LZUTF8')
    url.set('comp_enc', 'Base64')
    url.set('comp_code', compressed)
  } catch {
    console.error("tried to compress with unsupported compression algorithm or encoding");
  }
}
export function getUrlCode() {
  const alg = url.get('comp_alg')
  const enc = url.get('comp_enc')
  const code = url.get('comp_code')
  if (!alg || !enc || !code) return null;
  try {
    const uncompressed = decompressCode(alg, enc, code);
    // console.log("returning uncompressed", uncompressed)
    return uncompressed;
  } catch {
    return null;
  }
}
export const saveProgress = (input: string) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, input);
  addToUrl(input)
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////