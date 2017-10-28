import { Texture } from './texture';

export class Objeto {
    public state: string;

    constructor(private tex: Texture, 
        private images: {[key: string]: number[]},
        private rect: number[]) { 
            this.state = '0';
        }
    
    load(gl: WebGLRenderingContext): Promise<void> {
        return this.tex.load(gl);
    }

    render(gl: WebGLRenderingContext) {
        const images = this.images[0];
        if (!images) {
            return;
        }
        const img = images[this.state];
        if (!img) {
            return;
        }
        
        this.tex.render(gl, img[0], img[1], img[2], img[3], 
            this.rect[0], this.rect[1], this.rect[2], this.rect[3]);
    }    
}
