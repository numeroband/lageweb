import { ShadersProgram } from './shaders-program';
import { Font } from './font';

export class Texture {
    public width: number;
    public height: number;
    private tex: WebGLTexture;
    private img: HTMLImageElement;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private loaded: boolean = false;
    
    constructor(private program: ShadersProgram, readonly index: number, private url?: string) { }
    
    createTexture(gl: WebGLRenderingContext, bytes?: Uint8Array, width?: number, height?: number) {
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

    load(gl: WebGLRenderingContext): Promise<void> {
        if (this.loaded) {
            return Promise.resolve();
        }

        this.loaded = true;                
        this.img = new Image();
        return new Promise<void>((resolve, reject) => {
            this.img.src = this.url;
            this.img.addEventListener('load', () => {
                this.createTexture(gl);
                resolve();
            });
        });
    }

    vertices(zIndex, texX, texY,
            texWidth, texHeight, 
            dstX, dstY, 
            dstWidth?, dstHeight?, flip?) {

        if (dstWidth === undefined) {
            dstWidth = texWidth;
        }
            
        if (dstHeight === undefined) {
            dstHeight = texHeight;
        }

        dstX += this.offsetX;
        dstY += this.offsetY;

        const resX = 320.0;
        const resY = 200.0;
        const z = zIndex / 100;
        
        const minx = -1.0 + 2.0 * dstX / resX;
        const maxx = -1.0 + 2.0 * (dstX + dstWidth) / resX;
        const miny = -1.0 + 2.0 * dstY / resY;
        const maxy = -1.0 + 2.0 * (dstY + dstHeight) / resY;

        const minu = texX / this.width;
        const maxu = (texX + texWidth) / this.width;
        const minv = texY / this.height;
        const maxv = (texY + texHeight) / this.height;
        
        return [
            minx, -miny, z, minu, minv, this.index,
            maxx, -miny, z, maxu, minv, this.index,
            minx, -maxy, z, minu, maxv, this.index,

            maxx, -miny, z, maxu, minv, this.index,
            minx, -maxy, z, minu, maxv, this.index,
            maxx, -maxy, z, maxu, maxv, this.index
        ];
    }
    
    bind(gl: WebGLRenderingContext) {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
    }

    //Loads image at specified path
    createFromText(gl: WebGLRenderingContext, font: Font, text: string, color?: number[])
    {
        if (!text)
        {
            this.tex = null;
            return;
        }
        
        const {x, y, width, height} = font.getTextRect(text);
        const pixels = new Array(4 * width * height);
        pixels.fill(0);
        font.render(text, pixels, width, -x, -y, color);
        this.createTexture(gl, new Uint8Array(pixels), width, height);
        this.offsetX = x;
        this.offsetY = y;
        this.loaded = true;                
    }
    
}
