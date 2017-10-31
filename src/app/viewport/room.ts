import { Rect } from './common';
import { Renderer, Renderable } from './renderer';
import { Texture } from './texture';
import { HttpClient } from '@angular/common/http';
import { Objeto } from './objeto';

export class Room implements Renderable {    
    readonly tex: Texture;
    readonly objs: Objeto[] = [];

    constructor(readonly name: string, renderer: Renderer) {
        this.tex = renderer.newTexture();
    }

    load(http: HttpClient) {
        return Promise.all([
            this.tex.fromImage(`assets/images/${this.name}.png`),
            http.get<any>(`assets/jsons/${this.name}.json`).toPromise()
                .then(room => {
                    for (const key in room.objects) {
                        const {name, images, rect} = room.objects[key];
                        this.objs.push(new Objeto(this.tex, name, images, rect));
                    }
                    const {name, images, rect} = room['background'];
                    this.objs.push(new Objeto(this.tex, name, images, rect));
                })
        ]);
    }
    
    vertices(camera: Rect) {
        return this.objs.reduce((sum, obj) => sum.concat(obj.vertices(camera)), []);
    }
}
