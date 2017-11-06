export interface Resources {
    loadJson(name: string): Promise<any>;
    loadFont(name: string): Promise<any>;
}