import { Rect } from './common';
import { Texture } from './texture';

export class Objeto {
    public state: number = 0;

    constructor(readonly tex: Texture, 
        readonly name: string,
        private images: {[key: string]: number[]}[],
        private rect: number[]) { }
    
    vertices(): number[] {
        const layers = this.state < 1 ? {} : this.images[this.state - 1];
        if (!layers) {
            return [];
        }

        let vertices: number[] = [];
        Object.keys(layers).forEach((layer) => {
            const img = layers[layer];
            const objVertices = this.tex.vertices(Number(layer) * 2, new Rect(img[0], img[1], img[2], img[3]), 
                new Rect(this.rect[0], this.rect[1], this.rect[2], this.rect[3]));
            vertices.push(...objVertices);
        });

        return vertices;
    }    
}
