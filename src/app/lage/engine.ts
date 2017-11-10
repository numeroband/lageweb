import { Resources } from './resources';
import { Renderer } from './renderer';
import { Texture } from './texture';
import { Room } from './room';
import { Cursor } from './cursor';
import { Font } from './font';
import { Text } from './text';
import { Point, Rect } from './common';

export abstract class Engine {
    readonly resolution: Point;

    private room: Room | undefined;
    private frames: number = 0;
    private lastTimestamp: number = Date.now();
    private mouse: Point = new Point(0, 0);
    private cursor: Cursor;
    private fonts: {[name: string]: Font} = {};
    private texts: Text[];
    private camera: Rect;
    private fixedCamera: Rect;
    
    constructor(private renderer: Renderer, private resources: Resources) {
        this.resolution = this.createResolution();
        this.fixedCamera = new Rect(0, 0, this.resolution.x, this.resolution.y);        
        this.camera = new Rect(0, 0, this.resolution.x, this.resolution.y);
    }
  
    protected abstract newRoom(name: string): Room;
    protected abstract createResolution(): Point;
    protected abstract didInit(): Promise<any>;
    
    private createCursor() {
      const tex = this.renderer.newTexture();
      this.cursor = new Cursor(tex);
      return tex.fromImage('cursor');
    }
  
    private createFont(name: string) {
      let font = this.fonts[name];
  
      if (!font) {
        font = new Font(name);
        this.fonts[name] = font;
      }
  
      return font.load(this.resources);
    }
  
    init(): Promise<void> {
        this.texts = [
            new Text(this.renderer.newTexture()),
            new Text(this.renderer.newTexture()),
        ];

        return Promise.all([
        this.createCursor(),
        this.createFont('Atlantis_65_Charset00'),
        this.createFont('Atlantis_65_Charset01'),
        ]).then(() => {
            this.texts[0].setText('Hello world!!!', this.fonts['Atlantis_65_Charset00']);
            this.texts[0].pos = new Point(100, 100);

            this.texts[1].setText('Hello again$$%%', this.fonts['Atlantis_65_Charset01']);
            this.texts[1].pos = new Point(150, 50);

            return this.didInit();
        });
    }
  
    mouseMove(mouse: Point, down: boolean) {
        this.mouse = mouse;
        this.cursor.update(mouse);
        if (down && this.room) {
            this.room.currentActor.setPosition(mouse);
        }
    }
    
    render() {
        if (!this.room) {
            return;
        }

        this.renderer.render(this.camera, this.room);
        this.texts.forEach(text => this.renderer.render(this.fixedCamera, text));
        this.renderer.render(this.fixedCamera, this.cursor);
        this.room.actors.forEach(actor => this.renderer.render(this.camera, actor));
    }

    update() {
        if (!this.room) {
            return;
        }

        if (this.mouse.x > this.fixedCamera.w * 0.8 && this.camera.x < 300) {
            this.camera.x++;
        }
      
        if (this.mouse.x < this.fixedCamera.w * 0.2 && this.camera.x > 0) {
            this.camera.x--;
        }  

        this.room.actors.forEach(actor => actor.update());
    }

    enterRoom(name: string): Promise<void> {
        this.room = undefined;
        const newRoom = this.newRoom(name);
        return newRoom.load(this.resources, this.renderer)
            .then(() => {
                this.room = newRoom;
            });
    }
}  