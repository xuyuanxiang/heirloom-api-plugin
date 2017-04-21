/**
 * @module
 * @description
 *
 * @flow
 * @author xuyuanxiang
 * @date 2017/4/21
 */
declare type Heirloom$AllowedMethod = $Enum<{ get: string, post: string, update: string, patch: string, delete: string, put: string }>;
declare type Heirloom$Controller = Function | Array<Function>;
declare type Heirloom$API = { [key: Heirloom$AllowedMethod]: Heirloom$Controller };

declare type Heirloom$APIPluginOptions = {
    mock: boolean,
    scanDirectory: string,
    apiRoot: string,
};

declare class HeirloomAPIPlugin {
    constructor(options: Heirloom$APIPluginOptions): HeirloomAPIPlugin;
}