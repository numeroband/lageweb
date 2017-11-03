import { Rect } from './common';
import { Renderer, Renderable } from './renderer';
import { Texture } from './texture';
import { Costume } from './costume';
import { Objeto } from './objeto';

import { HttpClient } from '@angular/common/http';

export class Room implements Renderable {    
    public tex: Texture;
    readonly objs: Objeto[] = [];
    readonly costumes: {[name: string]: Costume} = {}

    constructor(readonly name: string) { }

    load(http: HttpClient, renderer: Renderer) {
        this.tex = renderer.newTexture();
        return http.get<any>(`assets/jsons/${this.name}.json`).toPromise()
            .then(room => {
                for (const key in room.objects) {
                    const {name, images, rect} = room.objects[key];
                    this.objs.push(new Objeto(this.tex, name, images, rect));
                }
                const {name, images, rect} = room['background'];
                const background = new Objeto(this.tex, name, images, rect);
                background.state = 1;
                this.objs.push(background);
                room.costumes.forEach(name => this.costumes[name] = new Costume(name));
                return Promise.all([
                    this.tex.fromImage(`assets/images/${this.name}.png`),
                    ...Object.keys(this.costumes).map(name => this.costumes[name].load(http, renderer))
                ]);
            });
    }
    
    vertices(camera: Rect) {
        return this.objs.reduce((sum, obj) => sum.concat(obj.vertices(camera)), []);
    }
}
