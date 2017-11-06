import { Rect } from './common';
import { Renderer, Renderable } from './renderer';
import { Texture } from './texture';
import { Costume } from './costume';
import { Objeto } from './objeto';
import { Box } from './box';
import { Resources } from './resources';

export class Room implements Renderable {    
    public tex: Texture;
    readonly objs: Objeto[] = [];
    readonly costumes: {[name: string]: Costume} = {}

    constructor(readonly name: string) { }

    load(resources: Resources, renderer: Renderer) {
        const box = new Box({}, []);

        this.tex = renderer.newTexture();
        return resources.loadJson(this.name)
            .then((room: any) => {
                for (const key in room.objects) {
                    const {name, images, rect} = room.objects[key];
                    this.objs.push(new Objeto(this.tex, name, images, rect));
                }
                const {name, images, rect} = room.background;
                const background = new Objeto(this.tex, name, images, rect);
                background.state = 1;
                this.objs.push(background);
                room.costumes.forEach((name: string) => this.costumes[name] = new Costume(name));
                return Promise.all([
                    this.tex.fromImage(this.name),
                    ...Object.keys(this.costumes).map(name => this.costumes[name].load(resources, renderer))
                ]);
            });
    }
    
    vertices(camera: Rect): number[] {
        return this.objs.reduce<number[]>((sum, obj) => sum.concat(obj.vertices(camera)), []);
    }
}
