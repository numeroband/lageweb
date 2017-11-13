import { Resources } from './resources';
import { Renderer } from './renderer';
import { Texture } from './texture';
import { Room } from './room';
import { Actor } from './actor';
import { Cursor } from './cursor';
import { Font } from './font';
import { Point, Rect } from './common';

class Timer {
    constructor(public frame: number, private resolve: () => void, private reject: () => void) { }

    check(frame: number): boolean {
        if (frame >= this.frame) {
            this.resolve();
            return true;
        }
        return false;
    }

    cancel() {
        this.reject();
    }
}

export abstract class Engine {
    readonly resolution: Point;
    public room: Room | undefined;
    public camera: Rect;

    protected cursor: Cursor;
    
    private mouse: Point = new Point(0, 0);
    private timers: Timer[] = [];
    private frame: number = 0;
    
    constructor(protected renderer: Renderer, protected resources: Resources) {
        this.resolution = this.createResolution();
        renderer.defaultCamera = new Rect(0, 0, this.resolution.x, this.resolution.y);        
        this.camera = new Rect(0, 0, this.resolution.x, this.resolution.y);
    }
  
    abstract init(): Promise<void>;
    abstract talkFont(): Font;
    abstract newActor(name: string): Actor;
    
    protected abstract newRoom(name: string): Room;
    protected abstract createResolution(): Point;
        
    mouseMove(mouse: Point, down: boolean) {
        this.mouse = mouse;
        if (down && this.room) {
            this.room.currentActor.say('I will move')
                .then(() => {
                    (this.room as Room).currentActor.setPosition(mouse);                    
                });
        }
    }
    
    render() {
        if (!this.room) {
            return;
        }

        this.room.render(this.renderer, this.camera);
        this.cursor.render(this.renderer);
    }

    update() {
        if (!this.room) {
            return;
        }

        this.frame++;
        this.timers = this.timers.filter(timer => !timer.check(this.frame));
        this.room.update();
        this.cursor.update(this.mouse);
    }

    enterRoom(name: string): Promise<void> {
        if (this.room) {
            this.room.exit();
            this.room = undefined;
        }
        const newRoom = this.newRoom(name);
        return newRoom.load(this.resources, this.renderer)
            .then(() => {
                this.room = newRoom;
                this.room.enter();
            });
    }

    waitFrames(frames: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.timers.push(new Timer(this.frame + frames, resolve, reject));
        });
    }
}  