{
  "targets": [
    {
      "target_name": "xsolcrypt",
      "sources": [ "xsolcrypt_wrapper.cpp", "XSolCrypt.cpp", "crc32o.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
    "cflags_cc": ["-std=c++11"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.7"
      },
      "msvs_settings": {
        "VCCLCompilerTool": { "ExceptionHandling": 1 }
      },
      "link_settings": {
        "libraries": ["-lstdc++"]
      }
    }
  ]
}
