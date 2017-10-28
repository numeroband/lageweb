import { ShadersProgram } from './shaders-program';

export class Texture {
    private tex: WebGLTexture;
    private img: HTMLImageElement;

    constructor(private program: ShadersProgram, readonly index: number, private url: string) { }
    
    load(gl: WebGLRenderingContext): Promise<void> {
        if (this.tex) {
            return Promise.resolve();
        }

        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
       
        // let's assume all images are not a power of 2
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
       
        this.img = new Image();
        return new Promise<void>((resolve, reject) => {
            this.img.src = this.url;
            this.img.addEventListener('load', () => {       
                gl.bindTexture(gl.TEXTURE_2D, this.tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);                                       
                resolve();
            });
        });
    }

    render(gl: WebGLRenderingContext, 
            texX, texY,
            texWidth, texHeight, 
            dstX, dstY, 
            dstWidth?, dstHeight?, flip?) {

        if (dstWidth === undefined) {
            dstWidth = texWidth;
        }
            
        if (dstHeight === undefined) {
            dstHeight = texHeight;
        }

        const resX = 320.0;
        const resY = 200.0;
        
        const minx = -1.0 + 2.0 * dstX / resX;
        const maxx = -1.0 + 2.0 * (dstX + dstWidth) / resX;
        const miny = -1.0 + 2.0 * dstY / resY;
        const maxy = -1.0 + 2.0 * (dstY + dstHeight) / resY;

        const minu = texX / this.img.width;
        const maxu = (texX + texWidth) / this.img.width;
        const minv = texY / this.img.height;
        const maxv = (texY + texHeight) / this.img.height;
        
        this.program.setPositions(gl, [
            minx, -miny,
            maxx, -miny,
            minx, -maxy,
            maxx, -miny,
            minx, -maxy,
            maxx, -maxy,
        ]);

        this.program.setTexcoords(gl, [
            minu, minv,
            maxu, minv,
            minu, maxv,
            maxu, minv,
            minu, maxv,
            maxu, maxv,
        ]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    bind(gl: WebGLRenderingContext) {
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
    }
}
