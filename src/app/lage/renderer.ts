import { Texture } from './texture';
import { Font } from './font';
import { Rect } from './common';

export interface Renderable {
    readonly tex: Texture;
    vertices(camera: Rect): number[];
}

export interface Renderer {
    newTexture(): Texture;
    render(camera: Rect, obj: Renderable): void;
}
