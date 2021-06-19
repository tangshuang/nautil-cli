# Nautil CLI

A CLI tool for [Nautil](https://github.com/tangshuang/nautil) app.

[Documents](https://nautil.js.org/#/cli/command)

## .nautil/cli-config.js

```
{
  version: CLI_VERSION, // the version of nautil-cli when init

  alias: {
    react: "../node_modules/react", // relative to .nautil/cli-config.json
  },
  chunks: false, // split chunks
  dll: false, // generate dll, higher priority than chunks
  define: {
    "process.env.NODE_ENV": "process.env.NODE_ENV",
    "MY_CONSTANT": "aaaa",
    "SOME_VAR": "process.env.SOME_VAR"
  },
  clear: true,
  analyer: false,
  sourceMap: true,

  port: 9000,
  host: '127.0.0.1',
  live: true,
  hot: false, // override live
  proxy: {
    "/api": "http://localhost:3000"
  },

  cache: false, // when true, nautil-cli will use cache feature

  env: {
    "development": { // to override configs
      clear: false,
      analyer: true,
      ...
    }
  },

  source: {
    // you can run `nautil build my-dir` to bundle scripts in `src/my-dir`
    "my-dir": {
      "platform": "dom",
      "extensions": [
        ".mobile.tsx",
        ".mobile.jsx"
      ],

      // export my-dir as a library with export name `my-lib`
      "libaray": "my-lib"
    }
  },
}
```
