import { Strategy } from 'passport-jwt';
declare const ChienLuocJwt_base: new (...args: any[]) => Strategy;
export declare class ChienLuocJwt extends ChienLuocJwt_base {
    constructor();
    validate(payload: any): Promise<{
        sub: any;
        email: any;
        role: any;
        name: any;
    }>;
}
export {};
