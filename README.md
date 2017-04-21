# heirloom-api-plugin

基于heirloom-core[Plugin](https://github.com/xuyuanxiang/heirloom-core#plugin)接口，对[koa-router^7.1.1](https://github.com/koajs/static#readme)的封装实现。

遵循规约重于配置的思想，扫描指定文件目录下的JS文件，按照文件目录层级自动映射成为路由。

e.g:
 + `project/api/v1/sample.js`  -> `http://domain.com/api/v1/sample`;
 + `project/api/v1/sample/index.js` -> `http://domain.com/api/v1/sample`;
 + `project/api/index.js` -> `http://domain.com/api`;

## 相关项目

+ [heirloom-core](https://github.com/xuyuanxiang/heirloom-core#heirloom-core)

## 快速开始

执行以下命令新建工程目录：`example/`

```bash
mkdir example && cd example && npm init
```

进入`example/`目录，执行以下命令安装依赖：

```npm
SASS_BINARY_SITE=https://npm.taobao.org/mirrors/node-sass/ npm install heirloom-core heirloom-api-plugin --save
```

编写`example/index.js`:

```javascript
const NormalServer = require('heirloom-core').NormalServer;
const KoaEngine = require('heirloom-core').KoaEngine;
const APIPlugin = require('heirloom-api-plugin').APIPlugin;

const server = new heirloomServer.NormalServer({
    logger: console,
    port: 4000,
    engine: KoaEngine.shareInstance(),
});

server.apply(new APIPlugin());

server.start();
```

编写`example/api/sample.js`文件，实现第一个API：

```javascript
exports.get = function (ctx) {
    ctx.body = 'sample';
};


在`example/`目录，执行以下命令启动服务：
```npm
node .
```

访问: `http://localhost:4000/api/sample`。
