import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Texture } from './texture';
import { Room } from './room';
import { Renderer } from './renderer';
import { Cursor } from './cursor';
import { HttpClient } from '@angular/common/http';
import { Font } from './font';
import { Text } from './text';
import { Point, Rect } from './common';

@Component({
  selector: 'app-viewport',
  templateUrl: './viewport.component.html',
  styleUrls: ['./viewport.component.css']
})
export class ViewportComponent implements OnInit {

  @ViewChild('vpCanvas') canvasRef: ElementRef;
  private running: boolean;
  private room: Room;
  private renderer: Renderer;
  private frames: number = 0;
  private lastTimestamp: number = Date.now();
  private mouse: Point = new Point(0, 0);
  private cursor: Cursor;
  private fonts: {[name: string]: Font} = {};
  private texts: Text[];
  private camera: Rect = new Rect(0, 0, 320, 200);
  private fixedCamera: Rect = new Rect(0, 0, 320, 200);
  
  constructor(private ngZone: NgZone, private http: HttpClient) { }

  private createRoom(roomName) {
    this.room = new Room(roomName, this.renderer);
    return this.room.load(this.http);
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

  ngOnInit() {
    const gl: WebGLRenderingContext =  this.canvasRef.nativeElement.getContext('webgl');
    this.canvasRef.nativeElement.addEventListener("mousemove", (event) => this.mouseMove(event));    
    this.renderer = new Renderer(gl, new Rect(0, 0, gl.canvas.width, gl.canvas.height));
    this.texts = [
      this.renderer.newText(),
      this.renderer.newText(),
    ];

    Promise.all([
      this.createRoom('Atlantis_09'),
      this.createCursor(),
      this.createFont('Atlantis_65_Charset00'),
      this.createFont('Atlantis_65_Charset01'),
    ]).then(() => {
      this.running = true;
      this.ngZone.runOutsideAngular(() => this.render());  
    });
  }

  mouseMove(event) {
    const rect = event.target.getBoundingClientRect();
    this.mouse.x = Math.floor((event.clientX - rect.left - 1) * 320 / rect.width);
    this.mouse.y = Math.floor((event.clientY - rect.top - 1) * 200 / rect.height);
    this.cursor.update(this.mouse);
  }
  
  render() {
    if (!this.running) {
      return;
    }

    const gl: WebGLRenderingContext = 
      this.canvasRef.nativeElement.getContext('webgl');

    this.texts[0].setText('Hello world!!!', this.fonts['Atlantis_65_Charset00']);
    this.texts[0].pos.x = 100;
    this.texts[0].pos.y = 100;

    this.texts[1].setText('Hello again$$%%', this.fonts['Atlantis_65_Charset01']);
    this.texts[1].pos.x = 150;
    this.texts[1].pos.y = 50;

    this.renderer.clear();
    this.renderer.render(this.camera, this.room);
    this.texts.forEach(text => this.renderer.render(this.fixedCamera, text));
    this.renderer.render(this.fixedCamera, this.cursor);

    if (++this.frames % 500 == 0) {
      const now = Date.now();
      console.log(`Frame rate: ${500000 / (now - this.lastTimestamp)} fps`);
      this.lastTimestamp = now;
    }

    if (this.mouse.x > this.fixedCamera.width * 0.8 && this.camera.x < 300) {
      this.camera.x++;
    }

    if (this.mouse.x < this.fixedCamera.width * 0.2 && this.camera.x > 0) {
      this.camera.x--;
    }

    requestAnimationFrame(() => this.render());
  }
}
