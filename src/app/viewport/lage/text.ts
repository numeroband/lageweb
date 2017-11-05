
import { Renderable} from './renderer';
import { Texture } from './texture';
import { Font } from './font';
import { Point, Rect } from './common';

export class Text implements Renderable {
    public pos: Point = new Point(0, 0);
    readonly tex: Texture;

    private text: string;
    private font: Font;

    constructor(private gl: WebGLRenderingContext) { 
        this.tex = new Texture(gl);
    }

    setText(text: string, font: Font, color?: number[]) {
        if (this.text === text && font.name === this.font.name) {
            return;
        }
        this.tex.fromText(font, text, color);
        this.text = text;
        this.font = font;
    }

    vertices(camera: Rect) {
        if (!this.tex || !this.text || this.text.length == 0) {
            return [];
        }

        return this.tex.vertices(camera, 98, new Rect(0, 0, this.tex.width, this.tex.height),
            new Rect(this.pos.x, this.pos.y, this.tex.width, this.tex.height));
    }
}    
