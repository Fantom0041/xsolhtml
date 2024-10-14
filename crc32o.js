class crc32o {
    static table_init = false;
    static crc32tab = new Array(256);

    constructor(crc32 = 0) {
        this.crc32 = crc32;
        if (!crc32o.table_init) {
            this.make_table();
        }
    }

    make_table() {
        for (let inx = 0; inx < 256; ++inx) {
            let entry32 = inx;

            for (let i = 0; i < 8; ++i) {
                const carry32 = entry32 & 1;
                entry32 >>>= 1;
                if (carry32) {
                    entry32 ^= 0xedb88320;
                }
            }
            crc32o.crc32tab[inx] = entry32;
        }
        crc32o.table_init = true;
    }

    put(buf, count) {
        if (count === undefined) {
            // Single byte version
            const inx32 = buf ^ this.crc32;
            this.crc32 >>>= 8;
            this.crc32 ^= crc32o.crc32tab[inx32];
        } else {
            // Buffer version
            if (count === 0) return;

            for (let i = 0; i < count; ++i) {
                const inx32 = buf[i] ^ this.crc32;
                this.crc32 >>>= 8;
                this.crc32 ^= crc32o.crc32tab[inx32];
            }
        }
    }

    getcrc() {
        return this.crc32;
    }
}

module.exports = crc32o;