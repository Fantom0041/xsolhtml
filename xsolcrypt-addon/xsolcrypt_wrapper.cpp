#include <napi.h>
#include "XSolCrypt.h"

Napi::Value Decode(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1) {
        Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    if (!info[0].IsBuffer()) {
        Napi::TypeError::New(env, "Argument must be a buffer").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Buffer<char> buffer = info[0].As<Napi::Buffer<char>>();
    std::string input(buffer.Data(), buffer.Length());

    XSolCrypt xsolCrypt;
    std::string result = xsolCrypt.Decode(input);

    return Napi::Buffer<char>::Copy(env, result.data(), result.size());
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "decode"), Napi::Function::New(env, Decode));
    return exports;
}

NODE_API_MODULE(xsolcrypt, Init)