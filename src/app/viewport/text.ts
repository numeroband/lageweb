import { Texture } from './texture';
import { Font } from './font';
import { ShadersProgram } from './shaders-program';

export class Text {
    public x: number = 0;
    public y: number = 0;

    private text: string;
    private font: Font;

    constructor(private tex: Texture) { }

    setText(gl: WebGLRenderingContext, text: string, font: Font, color?: number[]) {
        if (this.text === text && font.name === this.font.name) {
            return;
        }
        console.log('creating text', text, font.name);
        this.tex.createFromText(gl, font, text, color);
        this.text = text;
        this.font = font;
    }

    vertices() {
        return this.tex.vertices(90, 0, 0, this.tex.width, this.tex.height, 
                this.x, this.y);
    }
}    
