import { Texture } from './texture';

export class ShadersProgram {
    readonly MAX_TEXTURES = 8;
    readonly VERTEX_ELEMENTS = 6;

    private program: WebGLProgram;
    private positionLocation: number;
    private texcoordLocation: number;
    private positionBuffer: WebGLBuffer;
    private texindexLocation: number;
    private texturesLocation: WebGLUniformLocation;
    private textures: {[name: string]: Texture} = {};
    
    constructor(gl: WebGLRenderingContext, shaderSrc, fragmentSrc) { 
        this.program = this.initShaderProgram(gl, shaderSrc, fragmentSrc);
        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.texcoordLocation = gl.getAttribLocation(this.program, 'a_texcoord');
        this.texindexLocation = gl.getAttribLocation(this.program, 'a_texindex');
        this.positionBuffer = gl.createBuffer();        
        this.texturesLocation = gl.getUniformLocation(this.program, 'u_textures[0]');
    }

    use(gl: WebGLRenderingContext) {
        gl.useProgram(this.program);
        const textures = Object.values(this.textures);
        const locations: number[] = [];
        textures.forEach((tex) => {
            gl.activeTexture(gl.TEXTURE0 + tex.index);
            tex.bind(gl);
            locations.push(tex.index);
        });
        gl.uniform1iv(this.texturesLocation, locations);
    }

    setPositions(gl: WebGLRenderingContext, positions: number[]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        const bytesPerElement = this.VERTEX_ELEMENTS * Float32Array.BYTES_PER_ELEMENT;
        
        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 
            bytesPerElement, 0 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(this.positionLocation);

        gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 
            bytesPerElement, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(this.texcoordLocation);        

        gl.vertexAttribPointer(this.texindexLocation, 1, gl.FLOAT, false, 
            bytesPerElement, 5 * Float32Array.BYTES_PER_ELEMENT);            
        gl.enableVertexAttribArray(this.texindexLocation);
    }

    texture(name: string) {
        let tex = this.textures[name];
    
        if (!tex) {
            const len = Object.keys(this.textures).length;
            if (len == this.MAX_TEXTURES) {
                console.error('Trying to create more than', len, 'textures');
                return undefined;
            }
            tex = new Texture(this, len, `assets/images/${name}.png`);
            this.textures[name] = tex;
        }
    
        return tex;
      }
    
    private loadShader(gl: WebGLRenderingContext, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
      
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
      
        return shader;
    }
      
    private initShaderProgram(gl: WebGLRenderingContext, vsSource, fsSource) {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
      
        // Create the shader program
      
        const shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
      
        // If creating the shader program failed, alert
      
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
          alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
          return null;
        }
      
        return shaderProgram;
    }    
}
