const crc32o = require("./crc32o");
const { DEF_KEY, CONST_KEY, DEF_KEY_LEN, CONST_KEY_LEN } = require("./keys");

class XSolCrypt {
  constructor() {
    this.DEF_KEY = DEF_KEY;
    this.CONST_KEY = CONST_KEY;
    this.DEF_KEY_LEN = DEF_KEY_LEN;
    this.CONST_KEY_LEN = CONST_KEY_LEN;

    this.KEY_DEFAULT = this.DEF_KEY.reduce(
      (acc, val) => acc + String.fromCharCode(val),
      ""
    );
    this.KEYS = [];
  }

  addKey(k) {
    if (!this.KEYS.includes(k)) {
      this.KEYS.push(k);
    }
  }

  clearKeys() {
    this.KEYS = [];
  }

  getLastKey() {
    return this.KEYS.length > 0
      ? this.KEYS[this.KEYS.length - 1]
      : this.KEY_DEFAULT;
  }

  getKey(index) {
    return index >= 0 && index < this.KEYS.length
      ? this.KEYS[index]
      : this.KEY_DEFAULT;
  }

  crc32(data) {
    let crc = 0xffffffff;
    const table = this.createCRC32Table();

    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xff];
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  createCRC32Table() {
    let table = new Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
    return table;
  }

  encode(f) {
    // Check if already encrypted
    if (f.substring(0, 11) === "XCRYPT 1.00") {
      return f;
    }

    // Calculate CRC
    const crc = crc32o(Buffer.from(f));

    // Encrypt file
    const key = this.getLastKey();
    let keyi = ((crc >> 16) & 0xff00) | (crc & 0xff);
    while (keyi >= key.length) keyi >>= 1;

    let keyi2 = ((crc >> 24) & 0xff00) | ((crc >> 8) & 0xff);
    while (keyi2 >= this.CONST_KEY_LEN) keyi2 >>= 1;

    let nf = "XCRYPT 1.00";

    // Add CRC
    nf += String.fromCharCode((crc >> 24) & 0xff);
    nf += String.fromCharCode((crc >> 16) & 0xff);
    nf += String.fromCharCode((crc >> 8) & 0xff);
    nf += String.fromCharCode(crc & 0xff);

    // Encrypt data
    for (let i = 0; i < f.length; i++) {
      nf += String.fromCharCode(
        f.charCodeAt(i) ^ key.charCodeAt(keyi) ^ this.CONST_KEY[keyi2]
      );
      

      keyi++;
      if (keyi >= key.length) keyi = 0;

      keyi2++;
      if (keyi2 >= this.CONST_KEY_LEN) keyi2 = 0;
    }

    return nf;
  }

  decode(f) {
    const buffer = Buffer.from(f);
    if (buffer.length < 15) {
      return buffer;
    }

    // Check header [12 bytes]
    if (buffer.toString("ascii", 0, 11) !== "XCRYPT 1.00") {
      return buffer;
    }

    // Get CRC [4 bytes]
    let crc = 0;
    crc += (buffer[11] & 0xff) << 24;
    crc += (buffer[12] & 0xff) << 16;
    crc += (buffer[13] & 0xff) << 8;
    crc += buffer[14] & 0xff;

    // Decrypt file
    let ki = this.KEYS.length;
    let key = "";
    let nf = "";

    do {
      key = this.getKey(ki);

      let keyi = ((crc >> 16) & 0xff00) | (crc & 0xff);
      while (keyi >= key.length) keyi >>= 1;

      let keyi2 = ((crc >> 24) & 0xff00) | ((crc >> 8) & 0xff);
      while (keyi2 >= this.CONST_KEY_LEN) keyi2 >>= 1;

      nf = "";

      for (let i = 15; i < buffer.length; i++) {
        nf += String.fromCharCode(
          buffer[i] ^ key.charCodeAt(keyi) ^ this.CONST_KEY[keyi2]
        );

        keyi++;
        if (keyi >= key.length) {
          keyi = 0;
        }

        keyi2++;
        if (keyi2 >= this.CONST_KEY_LEN) {
          keyi2 = 0;
        }
      }

      // Check CRC
      const crc32 = new crc32o();
      crc32.put(Buffer.from(nf), nf.length);
      if (crc32.getcrc() === crc) {
        return Buffer.from(nf);
      } else {
        ki--;
      }
    } while (ki >= 0);

    return buffer;
  }
}

module.exports = XSolCrypt;
