import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Texture } from './texture';
import { Objeto } from './objeto';
import { VertexShader } from './vertex-shader';
import { FragmentShader } from './fragment-shader';
import { ShadersProgram } from './shaders-program';
import { Cursor } from './cursor';
import { HttpClient } from '@angular/common/http';
import { Font } from './font';
import { Text } from './text';

@Component({
  selector: 'app-viewport',
  templateUrl: './viewport.component.html',
  styleUrls: ['./viewport.component.css']
})
export class ViewportComponent implements OnInit {

  @ViewChild('vpCanvas') canvasRef: ElementRef;
  private running: boolean;
  private gl: WebGLRenderingContext;
  private objs: Objeto[];
  private background: Objeto;
  private program: ShadersProgram;
  private frames: number = 0;
  private lastTimestamp: number = Date.now();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private cursor: Cursor;
  private fonts: {[name: string]: Font} = {};
  private texts: Text[];
  
  constructor(private ngZone: NgZone, private http: HttpClient) { }

  private createObjects(roomName) {
    const gl: WebGLRenderingContext = this.canvasRef.nativeElement.getContext('webgl');

    return this.http.get<any>(`assets/jsons/${roomName}.json`).toPromise()
      .then(room => {
        const tex = this.program.texture(roomName);
        this.objs = [];
        for (const key in room.objects) {
          const {name, images, rect} = room.objects[key];
          this.objs.push(new Objeto(tex, name, images, rect));
        }
        const {name, images, rect} = room['background'];
        this.background = new Objeto(tex, name, images, rect);
        return Promise.all(this.objs.map(obj => obj.load(gl)));
      });
  }

  private createCursor(gl: WebGLRenderingContext) {
    const tex = this.program.texture('cursor');
    this.cursor = new Cursor(tex);
    return this.cursor.load(gl);
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
    
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.program = new ShadersProgram(gl, VertexShader, FragmentShader);
    Promise.all([
      this.createObjects('Atlantis_09'),
      this.createCursor(gl),
      this.createFont('Atlantis_65_Charset00'),
      this.createFont('Atlantis_65_Charset01')
    ]).then(() => {
      this.texts = [
        new Text(this.program.texture()),
        new Text(this.program.texture()),
      ];
      this.running = true;
      this.ngZone.runOutsideAngular(() => this.render());  
    });
  }

  mouseMove(event) {
    const rect = event.target.getBoundingClientRect();
    this.mouseX = Math.floor((event.clientX - rect.left - 1) * 320 / rect.width);
    this.mouseY = Math.floor((event.clientY - rect.top - 1) * 200 / rect.height);
    this.cursor.update(this.mouseX, this.mouseY);
  }
  
  render() {
    if (!this.running) {
      return;
    }

    const gl: WebGLRenderingContext = 
      this.canvasRef.nativeElement.getContext('webgl');

    this.texts[0].setText(gl, 'Hello world!!!', this.fonts['Atlantis_65_Charset00']);
    this.texts[0].x = 100;
    this.texts[0].y = 100;

    this.texts[1].setText(gl, 'Hello again$$%%', this.fonts['Atlantis_65_Charset01']);
    this.texts[1].x = 150;
    this.texts[1].y = 50;
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.program.use(gl);
    const vertices = this.objs.reduce((prev, obj) => prev.concat(obj.vertices()), this.background.vertices());
    vertices.push(...this.cursor.vertices());
    this.texts.forEach(text => vertices.push(...text.vertices()));
    this.program.setPositions(gl, vertices);
    const numTriangles = vertices.length / this.program.VERTEX_ELEMENTS;
    gl.drawArrays(gl.TRIANGLES, 0, numTriangles);

    if (++this.frames % 500 == 0) {
      const now = Date.now();
      console.log(`Frame rate: ${500000 / (now - this.lastTimestamp)} fps`);
      this.lastTimestamp = now;
    }

    requestAnimationFrame(() => this.render());
  }
}
