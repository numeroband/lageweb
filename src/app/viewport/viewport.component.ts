import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Renderer } from './lage/renderer';
import { Engine } from './lage/engine';
import { Point, Rect } from './lage/common';

@Component({
  selector: 'app-viewport',
  templateUrl: './viewport.component.html',
  styleUrls: ['./viewport.component.css']
})
export class ViewportComponent implements OnInit {

  @ViewChild('vpCanvas') canvasRef: ElementRef;
  private running: boolean;
  private renderer: Renderer;
  private engine: Engine;
  private frames: number = 0;
  private lastTimestamp: number = Date.now();
  private resolution: Point = new Point(320, 200);
  
  constructor(private ngZone: NgZone, private http: HttpClient) { }


  ngOnInit() {
    const gl: WebGLRenderingContext =  this.canvasRef.nativeElement.getContext('webgl');
    this.canvasRef.nativeElement.addEventListener("mousemove", (event) => this.mouseMove(event, false));    
    this.canvasRef.nativeElement.addEventListener("mousedown", (event) => this.mouseMove(event, true));    
    this.canvasRef.nativeElement.addEventListener("contextmenu", (event) => event.preventDefault());    
    this.renderer = new Renderer(gl);
    this.renderer.viewport = new Rect(0, 0, gl.canvas.width, gl.canvas.height);
    this.engine = new Engine(this.renderer, this.http, this.resolution);
    this.engine.init().then(() => {
      this.running = true;
      this.ngZone.runOutsideAngular(() => requestAnimationFrame(() => this.tick()));  
    });
  }

  mouseMove(event, down) {
    const rect = event.target.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left - 1) * this.resolution.x / rect.width);
    const y = Math.floor((event.clientY - rect.top - 1) * this.resolution.y / rect.height);
    this.engine.mouseMove(new Point(x, y), down); 
  }
  
  tick() {
    if (!this.running) {
      return;
    }

    this.engine.tick();

    if (++this.frames % 500 == 0) {
      const now = Date.now();
      console.log(`Frame rate: ${500000 / (now - this.lastTimestamp)} fps`);
      this.lastTimestamp = now;
    }

    this.ngZone.runOutsideAngular(() => requestAnimationFrame(() => this.tick()));  
  }
}
