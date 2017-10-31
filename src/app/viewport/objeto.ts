import { Rect } from './common';
import { Renderable } from './renderer';
import { Texture } from './texture';

export class Objeto implements Renderable {
    public state: number = 1;

    constructor(readonly tex: Texture, 
        readonly name: string,
        private images: {[key: number]: number[]}[],
        private rect: number[]) { }
    
    vertices(camera: Rect) {
        const layers = this.state < 1 ? [] : this.images[this.state - 1];
        if (!layers) {
            return [];
        }

        let vertices = [];
        Object.keys(layers).forEach((layer) => {
            const img = layers[layer];
            const objVertices = this.tex.vertices(camera, Number(layer), new Rect(img[0], img[1], img[2], img[3]), 
                new Rect(this.rect[0], this.rect[1], this.rect[2], this.rect[3]));
            vertices.push(...objVertices);
        });

        return vertices;
    }    
}
