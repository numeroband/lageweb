import { Rect } from './common';
import { Renderer, Renderable } from './renderer';
import { Texture } from './texture';
import { Costume } from './costume';
import { Objeto } from './objeto';
import { Boxes } from './boxes';
import { Resources } from './resources';
import { Actor } from './actor';
import { Engine } from './engine';

export abstract class Room implements Renderable {
    public tex: Texture;
    public boxes: Boxes;
    public actors: Actor[] = [];
    public currentActor: Actor;
    readonly objs: Objeto[] = [];
    readonly costumes: {[name: string]: Costume} = {}

    constructor(readonly name: string, protected engine: Engine) { }

    protected abstract onLoad(renderer: Renderer): void;

    load(resources: Resources, renderer: Renderer) {

        this.tex = renderer.newTexture();
        return resources.loadJson(this.name)
            .then((room: any) => {
                this.boxes = new Boxes(room.boxes, room.scaleSlots);
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
                ]).then(() => this.onLoad(renderer));
            });
    }
    
    vertices(camera: Rect): number[] {
        return this.objs.reduce<number[]>((sum, obj) => sum.concat(obj.vertices(camera)), []);
    }
}
