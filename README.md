# heirloom-api-plugin [![NPM version](http://img.shields.io/npm/v/heirloom-api-plugin.svg?style=flat)](https://npmjs.org/package/heirloom-api-plugin)

[![NPM Downloads](https://img.shields.io/npm/dm/heirloom-api-plugin.svg?style=flat)](https://npmjs.org/package/heirloom-api-plugin)
[![Node.js Version](https://img.shields.io/node/v/heirloom-api-plugin.svg?style=flat)](http://nodejs.org/download/)
[![Build Status](https://travis-ci.org/xuyuanxiang/heirloom-api-plugin.svg?style=flat-square)](https://travis-ci.org/xuyuanxiang/heirloom-api-plugin)

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
npm install heirloom-core heirloom-api-plugin --save
```

编写`example/index.js`:

```javascript
const NormalServer = require('heirloom-core').NormalServer;
const KoaEngine = require('heirloom-core').KoaEngine;
const HeirloomAPIPlugin = require('heirloom-api-plugin').HeirloomAPIPlugin;

const server = new NormalServer({
    logger: console,
    port: 4000,
    engine: KoaEngine.shareInstance(),
});

server.apply(new HeirloomAPIPlugin());

server.start();
```

编写`example/api/sample.js`文件，实现用于**生产环境**的API：

```javascript
// GET请求
exports.get = function (ctx) {
    ctx.body = 'production';
};
```

编写`example/api/__mocks__/sample.js`文件，Mock接口：

```javascript
// GET请求
exports.get = function (ctx) {
    ctx.body = 'staging';
};
```

在`example/`目录，执行以下命令启动服务：
```npm
node .
```

另起一个终端访问：
```bash
curl http://localhost:4000/api/sample # 返回：staging
```

结束之前启动的进程，加上环境变量`NODE_ENV`再次启动服务：
```npm
NODE_ENV=production node .
```

另起一个终端访问：
```bash
curl http://localhost:4000/api/sample # 返回：production
```

## 类型定义

```javascript
// HTTP Methods
declare type Heirloom$AllowedMethod = $Enum<{ get: string, post: string, update: string, patch: string, delete: string, put: string }>;

// Controller, 单个或多个Function，多个Function时详见：https://github.com/alexmingoia/koa-router#multiple-middleware
declare type Heirloom$Controller = Function | Array<Function>;

// API.js
declare type Heirloom$API = { [key: Heirloom$AllowedMethod]: Heirloom$Controller };

// HeirloomAPIPlugin类构造参数
declare type Heirloom$APIPluginOptions = {
    mock: boolean, // 是否启用mock，缺省（默认）为：process.env.NODE_ENV !== 'production'，即在NODE_ENV环境变量值为`production`时关闭mock。
    scanDirectory: string, // 扫描目录，缺省（默认）为：api/
    apiRoot: string, // 路由前缀，缺省（默认）为：/api，即：http://domain.com/api/path/to/something，如有需要可指定为：/，即：http://domain.com/path/to/something
};

// HeirloomAPIPlugin类
declare class HeirloomAPIPlugin {
    constructor(options: Heirloom$APIPluginOptions): HeirloomAPIPlugin;
}
```

## 根据`Heirloom$API`实现其他类型的请求的接口

`example/api/sample.js`:

```javascript
// POST api/sample
exports.post = function (ctx) {
    ctx.body = 'post';
};

// PATCH api/sample
exports.patch = function (ctx) {
    ctx.body = 'patch';
};

// DELETE api/sample
exports.delete = function (ctx) {
    ctx.body = 'post';
};

// update、put...略
```

## 路径参数（Path Variables）

`example/api/sample.js`:

```javascript
// GET: api/sample/1
function get(ctx) {
    ctx.body = { id: ctx.params.id }; // { id: 1 }
}

get.params = ':id';

exports.get = get;
```

## ES6 Class
```javascript
require('isomorphic-fetch');

class SampleAPI {

    async get(ctx) {
        const username = ctx.query.username;
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (response.ok) {
            ctx.body = await response.json();
        } else {
            const text = await response.text();
            throw new Error(text);
        }
    }

    async post(ctx) {
    }

}

module.exports = new SampleAPI();

```

## Mock

正式环境 | Mock | 请求 |
--------|------|-----
`/api/v1/sample/index.js`|`/api/v1/sample/__mocks__/index.js`|`http://domain.com/api/v1/sample`|
`/api/v1/sample.js` | `/api/v1/__mocks__/sample.js` | `http://domain.com/api/v1/sample`|