cmd_Release/xsolcrypt.node := c++ -bundle -undefined dynamic_lookup -Wl,-search_paths_first -mmacosx-version-min=10.7 -arch x86_64 -L./Release -stdlib=libc++  -o Release/xsolcrypt.node Release/obj.target/xsolcrypt/xsolcrypt_wrapper.o Release/obj.target/xsolcrypt/XSolCrypt.o Release/obj.target/xsolcrypt/crc32o.o Release/nothing.a -lstdc++
