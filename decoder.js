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

  encode(f) {
    const buffer = Buffer.from(f);
    
    // Check if already encrypted
    if (buffer.toString("ascii", 0, 11) === "XCRYPT 1.00") {
      return buffer;
    }

    // Calculate CRC
    const crc32 = new crc32o();
    crc32.put(buffer, buffer.length);
    const crc = crc32.getcrc();

    // Encrypt file
    const key = this.getLastKey();
    let keyi = ((crc >> 16) & 0xff00) | (crc & 0xff);
    while (keyi >= key.length) keyi >>= 1;

    let keyi2 = ((crc >> 24) & 0xff00) | ((crc >> 8) & 0xff);
    while (keyi2 >= this.CONST_KEY_LEN) keyi2 >>= 1;

    let nf = Buffer.alloc(buffer.length + 15);
    nf.write("XCRYPT 1.00", 0);

    // Add CRC
    nf.writeUInt32BE(crc, 11);

    // Encrypt data
    for (let i = 0; i < buffer.length; i++) {
      nf[i + 15] = buffer[i] ^ key.charCodeAt(keyi) ^ this.CONST_KEY[keyi2];

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
    const crc = buffer.readUInt32BE(11);

    // Decrypt file
    let ki = this.KEYS.length;
    let key = "";
    let nf;

    do {
      key = this.getKey(ki);

      let keyi = ((crc >> 16) & 0xff00) | (crc & 0xff);
      while (keyi >= key.length) keyi >>= 1;

      let keyi2 = ((crc >> 24) & 0xff00) | ((crc >> 8) & 0xff);
      while (keyi2 >= this.CONST_KEY_LEN) keyi2 >>= 1;

      nf = Buffer.alloc(buffer.length - 15);

      for (let i = 15; i < buffer.length; i++) {
        nf[i - 15] = buffer[i] ^ key.charCodeAt(keyi) ^ this.CONST_KEY[keyi2];

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
      crc32.put(nf, nf.length);
      if (crc32.getcrc() === crc) {
        return nf;
      } else {
        ki--;
      }
    } while (ki >= 0);

    return buffer;
  }
}

module.exports = XSolCrypt;
