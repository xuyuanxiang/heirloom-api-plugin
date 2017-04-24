/**
 * @module
 * @description
 *
 * @flow
 * @author xuyuanxiang
 * @date 2017/4/20
 */
import path from 'path';
import Router from 'koa-router';
import createDebug from 'debug';
import fs from 'fs';
import pkg from '../package.json';

const debug = createDebug('heirloom-api-plugin');
const DEFAULTS: Heirloom$APIPluginOptions = {
    mock: process.env.NODE_ENV !== 'production',
    scanDirectory: 'api',
    apiRoot: '/api',
};
const MOCKS = '__mocks__';
const ALLOWED_METHODS: Array<Heirloom$AllowedMethod> = ['get', 'post', 'update', 'patch', 'delete', 'put'];

export default class HeirloomAPIPlugin {
    name: string = pkg.name;
    version: string = pkg.version;
    apiRoot: string;
    scanDirectory: string;
    mock: boolean;
    router: typeof Router;
    sourceFiles: Array<string> = [];

    constructor({
                    mock = DEFAULTS.mock,
                    scanDirectory = DEFAULTS.scanDirectory,
                    apiRoot = DEFAULTS.apiRoot,
                }: Heirloom$APIPluginOptions = DEFAULTS) {
        if (!scanDirectory) {
            throw new TypeError('构造参数："scanDirectory"不能为空');
        }
        if (!apiRoot) {
            throw new TypeError('构造参数："apiRoot"不能为空');
        }
        if (path.isAbsolute(scanDirectory)) {
            this.scanDirectory = scanDirectory;
        } else {
            this.scanDirectory = path.resolve(scanDirectory);
        }
        if (!fs.existsSync(this.scanDirectory) ||
            !fs.statSync(this.scanDirectory).isDirectory()) {
            throw new TypeError(`无效的构造参数："scanDirectory"，${scanDirectory} 目录不存在`);
        }
        this.apiRoot = apiRoot;
        this.mock = !!mock;
        this.router = new Router();
    }

    pick(file: string) {
        const { ext, name } = path.parse(file);
        const stats = fs.statSync(file);
        if (stats.isDirectory() && name !== MOCKS) {
            fs.readdirSync(file).forEach((child: string) => {
                this.pick(path.join(file, child));
            });
        } else if (stats.isFile()) {
            if (ext === '.js') {
                this.sourceFiles.push(file);
            }
        }
    }

    scan() {
        debug('Scanning:', this.scanDirectory);
        this.pick(this.scanDirectory);
        debug('Scanned:', this.sourceFiles);
    }

    analyze() {
        if (this.sourceFiles && this.sourceFiles.length) {
            this.sourceFiles.forEach((it: string) => {
                let file = it;
                const { dir, base, name } = path.parse(it);
                if (this.mock) {
                    const mockFile = path.join(dir, MOCKS, base);
                    if (fs.existsSync(mockFile) && fs.statSync(mockFile).isFile()) {
                        file = mockFile;
                    }
                }
                debug('analyzing:', file);
                // $FlowFixMe -
                const module: Heirloom$API = require(file);// eslint-disable-line
                const route: string = path.join(this.apiRoot, path.relative(this.scanDirectory, it))
                    .replace(/\\/g, '/')
                    .replace(/\.js$/, '');
                if (name === 'index') {
                    this.dispatch(route.replace('/index', ''), module);
                } else {
                    this.dispatch(route, module);
                }
                debug('analyzed:', file);
            });
        }
    }

    dispatch(route: string, handler: Heirloom$API) {
        if (handler) {
            ALLOWED_METHODS.forEach((method: Heirloom$AllowedMethod) => {
                if (handler[method]) {
                    this.route(route, handler[method], method);
                }
            });
        }
    }

    route(route: string, controller: Heirloom$Controller, method?: Heirloom$AllowedMethod) {
        if (typeof controller === 'function') {
            const params = controller.params;
            if (typeof params === 'string' && /^(:\w+)+/.test(params)) {
                const pathVariables = path.join(route, params).replace(/\\/g, '/');
                debug('route: ', method, pathVariables);
                this.router[method](pathVariables, controller);
            } else {
                debug('route: ', method, route);
                this.router[method](route, controller);
            }
        } else if (Array.isArray(controller)) {
            const controllers: Array<Function> = controller.filter(it => typeof it === 'function');
            if (controllers.length) {
                debug('route: ', method, route);
                this.router[method](route, ...controllers);
            }
        }
    }

    applyForKoa() {
        this.scan();
        this.analyze();
        return [this.router.routes(), this.router.allowedMethods()];
    }

    apply({ engine }: { engine: { name: string, version: string } }) {
        if (engine.name === 'koa') {
            debug(`${this.name} applying for ${engine.name}-${engine.version}`);
            return this.applyForKoa();
        }
        return null;
    }
}
