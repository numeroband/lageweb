import { Texture } from './texture';

export class Objeto {
    public state: number = 1;

    constructor(private tex: Texture, 
        readonly name: string,
        private images: {[key: number]: number[]}[],
        private rect: number[]) { }
    
    load(gl: WebGLRenderingContext): Promise<void> {
        return this.tex.load(gl);
    }

    vertices() {
        const layers = this.state < 1 ? [] : this.images[this.state - 1];
        if (!layers) {
            return [];
        }

        let vertices = [];
        Object.keys(layers).forEach((layer) => {
            const img = layers[layer];
            const objVertices = this.tex.vertices(layer, img[0], img[1], img[2], img[3], 
                this.rect[0], this.rect[1], this.rect[2], this.rect[3])
            vertices.push(...objVertices);
        });

        return vertices;
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