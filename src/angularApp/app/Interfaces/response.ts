export default interface Response{
    readonly success: boolean;
    readonly deleteToken?: boolean;
    token?: string;
    expires?: number;
    mes?: string;
    [propName: string]: any;
}
