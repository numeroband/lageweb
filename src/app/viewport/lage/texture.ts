import { Point, Rect } from './common';
import { Font } from './font';

export class Texture {
    public width: number;
    public height: number;
    private tex: WebGLTexture;
    private img: HTMLImageElement;
    private offset: Point = new Point(0, 0);
    
    constructor(private gl: WebGLRenderingContext) { }
    
    private createTexture(bytes?: Uint8Array, width?: number, height?: number) {
        const gl = this.gl;
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);

        if (bytes) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
            this.width = width;
            this.height = height;
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

    fromImage(url: string): Promise<void> {
        this.img = new Image();
        return new Promise<void>((resolve, reject) => {
            this.img.src = url;
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

    fromText(font: Font, text: string, color?: number[])
    {
        const {x, y, width, height} = font.getTextRect(text);
        const pixels = new Uint8Array(4 * width * height);
        pixels.fill(0);
        font.render(text, pixels, width, -x, -y, color);
        this.createTexture(pixels, width, height);
        this.offset.x = x;
        this.offset.y = y;
    }
    
}
