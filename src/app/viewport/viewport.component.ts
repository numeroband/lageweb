import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Texture } from './texture';
import { Objeto } from './objeto';
import { VertexShader } from './vertex-shader';
import { FragmentShader } from './fragment-shader';
import { ShadersProgram } from './shaders-program';

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
  private program: ShadersProgram;

  constructor(private ngZone: NgZone) { }


  createObjects(roomName) {
    const gl: WebGLRenderingContext = this.canvasRef.nativeElement.getContext('webgl');

    return fetch(`assets/jsons/${roomName}.json`)
      .then(r => r.json())
      .then(room => {
        const tex = this.program.texture(roomName);
        this.objs = Object.values(room.objects).map(({images, rect}) => new Objeto(tex, images, rect));
        const {images, rect} = room['background'];
        this.objs.push(new Objeto(tex, images, rect));
        return Promise.all(this.objs.map(obj => obj.load(gl)));
      });
  }

  ngOnInit() {
    const gl: WebGLRenderingContext =  this.canvasRef.nativeElement.getContext('webgl');

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false); // Disable writing to depth buffer

    this.program = new ShadersProgram(gl, VertexShader, FragmentShader);
    this.createObjects('Atlantis_09').then(() => {
        this.running = true;
        this.ngZone.runOutsideAngular(() => this.render());  
    });
  }

  render() {
    if (!this.running) {
      return;
    }

    const gl: WebGLRenderingContext = 
      this.canvasRef.nativeElement.getContext('webgl');

    gl.clear(gl.COLOR_BUFFER_BIT);
    this.program.use(gl);
    for (const obj of this.objs) {
      obj.render(gl);
    }

    // requestAnimationFrame(() => this.render());
  }
}
