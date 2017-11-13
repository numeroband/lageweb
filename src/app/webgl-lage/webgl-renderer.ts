import { VertexShader } from './vertex-shader';
import { FragmentShader } from './fragment-shader';
import { LAGEWebGLTexture } from './webgl-texture';

import { Renderer } from '../lage/renderer'
import { Texture } from '../lage/texture'
import { Rect } from '../lage/common';

const VERTEX_ELEMENTS = 3 + 2;

export class LAGEWebGLRenderer implements Renderer {
    public defaultCamera: Rect;

    private program: WebGLProgram;
    private positionLocation: number;
    private texcoordLocation: number;
    private positionBuffer: WebGLBuffer;
    private cameraLocation: WebGLUniformLocation;
    private texrectLocation: WebGLUniformLocation;
    private textureLocation: WebGLUniformLocation;
    
    constructor(private gl: WebGLRenderingContext) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(0.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.GREATER);
    
        this.program = this.initShaderProgram(gl, VertexShader, FragmentShader);
        this.positionLocation = gl.getAttribLocation(this.program, 'a_position');
        this.texcoordLocation = gl.getAttribLocation(this.program, 'a_texcoord');
        this.cameraLocation = gl.getUniformLocation(this.program, 'u_camera');
        this.texrectLocation = gl.getUniformLocation(this.program, 'u_texrect');
        this.textureLocation = gl.getUniformLocation(this.program, 'u_texture');
        this.positionBuffer = gl.createBuffer();        
    }

    set viewport(rect: Rect) {
        this.gl.viewport(rect.x, rect.y, rect.w, rect.h);
    }

    newTexture(): Texture {
        return new LAGEWebGLTexture(this.gl);
    }

    render(tex: Texture, vertices: number[], camera?: Rect): void {
        const gl = this.gl;
        const bytesPerElement = VERTEX_ELEMENTS * Float32Array.BYTES_PER_ELEMENT;

        if (vertices.length == 0) {
            return;
        }

        if (!camera) {
            camera = this.defaultCamera;
        }

        (<LAGEWebGLTexture>tex).bind();

        gl.activeTexture(gl.TEXTURE0);        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.uniform1i(this.textureLocation, 0);
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.vertexAttribPointer(this.positionLocation, 3, gl.FLOAT, false, 
            bytesPerElement, 0 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(this.positionLocation);

        gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 
            bytesPerElement, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(this.texcoordLocation);        

        gl.uniform4fv(this.cameraLocation, new Float32Array([camera.x, camera.y, camera.w, camera.h]));
        gl.uniform2fv(this.texrectLocation, new Float32Array([tex.width, tex.height]));

        const numTriangles = vertices.length / VERTEX_ELEMENTS;
        gl.drawArrays(gl.TRIANGLES, 0, numTriangles);
    
    }

    clear() {
        this.gl.useProgram(this.program);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
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
