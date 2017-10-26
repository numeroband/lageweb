import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { VertexShader } from './vertex-shader';
import { FragmentShader } from './fragment-shader';

@Component({
  selector: 'app-viewport',
  templateUrl: './viewport.component.html',
  styleUrls: ['./viewport.component.css']
})
export class ViewportComponent implements OnInit {

  @ViewChild('vpCanvas') canvasRef: ElementRef;
  private running: boolean;
  private gl: WebGLRenderingContext;

  constructor(private ngZone: NgZone) { }

  ngOnInit() {
    this.running = true;
    fetch('assets/vertex.shader')
      .then((response: Response) => response.text())
      .then((text: string) => {
        console.log('fetch returned', text);
        this.ngZone.runOutsideAngular(() => this.render());
      });
  }

  render() {
    if (!this.running) {
      return;
    }

    const gl: WebGLRenderingContext = 
      this.canvasRef.nativeElement.getContext('webgl');

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  
    // Clear the canvas before we start drawing on it.
  
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    requestAnimationFrame(() => this.render());
  }
}
