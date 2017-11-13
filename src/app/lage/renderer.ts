import { Texture } from './texture';
import { Font } from './font';
import { Rect } from './common';

export interface Renderer {
    defaultCamera: Rect;
    
    newTexture(): Texture;
    render(tex: Texture, vertices: number[], camera?: Rect): void;
}
