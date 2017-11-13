import { Rect } from './common';
import { Renderer } from './renderer';
import { Texture } from './texture';
import { Costume } from './costume';
import { Objeto } from './objeto';
import { Boxes } from './boxes';
import { Resources } from './resources';
import { Actor } from './actor';
import { Engine } from './engine';

export abstract class Room {
    public boxes: Boxes;
    public actors: Actor[] = [];
    public currentActor: Actor;
    readonly objs: Objeto[] = [];
    readonly costumes: {[name: string]: Costume} = {}
    
    private tex: Texture;
    
    constructor(readonly name: string, protected engine: Engine) { }

    abstract enter(): void;
    abstract exit(): void;
    
    protected abstract costumesMap(): { [name: string]: string }

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
                const costumesMap = this.costumesMap();
                Object.keys(costumesMap).forEach(name => this.costumes[name] = new Costume(costumesMap[name]))
                return Promise.all([
                    this.tex.fromImage(this.name),
                    ...Object.keys(this.costumes).map(name => this.costumes[name].load(resources, renderer))
                ]);
            });
    }
    
    render(renderer: Renderer, camera: Rect) {
        const vertices: number[] = [];
        this.objs.forEach(obj => vertices.push(...obj.vertices()));
        renderer.render(this.tex, vertices, camera);

        this.actors.forEach(actor => actor.render(renderer, camera));
    }

    update() {
        this.actors.forEach(actor => actor.update());
    }
}
