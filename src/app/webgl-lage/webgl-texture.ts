import { Point, Rect } from '../lage/common';
import { Font } from '../lage/font';
import { Texture } from '../lage/texture';

export class LAGEWebGLTexture implements Texture {
    public width: number;
    public height: number;
    
    private offset: Point = new Point(0, 0);
    private tex: WebGLTexture;
    private img: HTMLImageElement;
    private surface: Uint8Array;
    
    constructor(private gl: WebGLRenderingContext) { }
    
    private createTexture() {
        const gl = this.gl;
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);

        if (this.surface) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.surface);
            this.surface = undefined;
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
            this.width = this.img.width;
            this.height = this.img.height;
            this.img = undefined;    
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);          
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    fromImage(name: string): Promise<void> {
        this.img = new Image();
        return new Promise<void>((resolve, reject) => {
            this.img.src = `assets/images/${name}.png`;
            this.img.addEventListener('load', () => {
                this.createTexture();
                resolve();
            });
        });
    }

    vertices(camera: Rect, z: number, src: Rect, dst: Rect, flip?: boolean) {
        const minx = dst.x;
        const maxx = (dst.x + dst.w);
        const miny = dst.y;
        const maxy = (dst.y + dst.h);

        const minu = flip ? (src.x + src.w) : src.x;
        const maxu = flip ? src.x : (src.x + src.w);
        const minv = src.y;
        const maxv = (src.y + src.h);
        
        return [
            minx, miny, z, minu, minv,
            maxx, miny, z, maxu, minv,
            minx, maxy, z, minu, maxv,

            maxx, miny, z, maxu, minv,
            minx, maxy, z, minu, maxv,
            maxx, maxy, z, maxu, maxv
        ];
    }
    
    bind() {
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
    }

    newSurface(width: number, height: number): void {
        this.surface = new Uint8Array(width * height * 4);
        this.surface.fill(0);
        this.width = width;
        this.height = height;
    }

    setColor(x: number, y: number, r: number, g: number, b: number, a: number): void {
        const start = 4 * (this.width * y + x);
        this.surface[start + 0] = r;
        this.surface[start + 1] = g;
        this.surface[start + 2] = b;
        this.surface[start + 3] = a;        
    }

    fromSurface(): void {
        if (this.surface) {
            this.createTexture();
        }
    }
}
