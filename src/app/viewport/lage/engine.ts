import { HttpClient } from '@angular/common/http';
import { Renderer } from './renderer';
import { Texture } from './texture';
import { Room } from './room';
import { Cursor } from './cursor';
import { Font } from './font';
import { Text } from './text';
import { Costume } from './costume';
import { Point, Rect } from './common';

export class Engine {
    private room: Room;
    private frames: number = 0;
    private lastTimestamp: number = Date.now();
    private mouse: Point = new Point(0, 0);
    private cursor: Cursor;
    private fonts: {[name: string]: Font} = {};
    private texts: Text[];
    private camera: Rect;
    private fixedCamera: Rect;
    private costume: Costume;
    private costumePos: Point = new Point(80, 80);
    
    constructor(private renderer: Renderer, private http: HttpClient, resolution: Point) {
        this.fixedCamera = new Rect(0, 0, resolution.x, resolution.y);        
        this.camera = new Rect(0, 0, resolution.x, resolution.y);
    }
  
    private createRoom(roomName) {
      this.room = new Room(roomName);
      return this.room.load(this.http, this.renderer);
    }
  
    private createCursor() {
      const tex = this.renderer.newTexture();
      this.cursor = new Cursor(tex);
      return tex.fromImage('assets/images/cursor.png');
    }
  
    private createFont(name: string) {
      let font = this.fonts[name];
  
      if (!font) {
        font = new Font(name);
        this.fonts[name] = font;
      }
  
      return font.load(this.http);
    }
  
    init(): Promise<any> {
      this.texts = [
        this.renderer.newText(),
        this.renderer.newText(),
      ];
  
      return Promise.all([
        this.createRoom('Atlantis_09'),
        this.createCursor(),
        this.createFont('Atlantis_65_Charset00'),
        this.createFont('Atlantis_65_Charset01'),
      ]).then(() => {
        this.texts[0].setText('Hello world!!!', this.fonts['Atlantis_65_Charset00']);
        this.texts[0].pos.x = 100;
        this.texts[0].pos.y = 100;
    
        this.texts[1].setText('Hello again$$%%', this.fonts['Atlantis_65_Charset01']);
        this.texts[1].pos.x = 150;
        this.texts[1].pos.y = 50;

        this.costume = this.room.costumes['Atlantis_00_Cost03'];  
        this.costume.setAnimation(4, false);
        this.costume.setAnimation(8, false);
    });
    }
  
    mouseMove(mouse: Point, down: boolean) {
        this.mouse = mouse;
        this.cursor.update(mouse);
        if (down) {
            this.costumePos.x = mouse.x + this.camera.x;
            this.costumePos.y = mouse.y + this.camera.y;
        }
    }
    
    tick() { 
        this.update();
        this.render();        
    }

    private render() {
        this.renderer.clear();
        this.renderer.render(this.camera, this.room);
        this.texts.forEach(text => this.renderer.render(this.fixedCamera, text));
        this.renderer.render(this.fixedCamera, this.cursor);  
        this.renderer.render(this.camera, this.costume);
    }

    private update() {
        if (this.mouse.x > this.fixedCamera.w * 0.8 && this.camera.x < 300) {
            this.camera.x++;
        }
      
        if (this.mouse.x < this.fixedCamera.w * 0.2 && this.camera.x > 0) {
            this.camera.x--;
        }  

        this.costume.update(this.costumePos, 2, 1.0, 255);
    }
}  