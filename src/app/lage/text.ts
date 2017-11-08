import { Renderable} from './renderer';
import { Texture } from './texture';
import { Font } from './font';
import { Point, Rect } from './common';

export class Text implements Renderable {
    public pos: Point;

    private text: string;
    private font: Font;
    private offset: Point = new Point(0, 0);

    constructor(readonly tex: Texture) { }

    setText(text: string, font: Font, color?: number[]) {
        if (this.text === text && font.name === this.font.name) {
            return;
        }
        const {x, y, width, height} = font.getTextRect(text);
        this.tex.newSurface(width, height);
        font.render(text, this.tex, -x, -y, color);
        this.tex.fromSurface();
        this.offset.x = x;
        this.offset.y = y;
        this.text = text;
        this.font = font;
    }

    vertices(camera: Rect) {
        if (!this.tex || !this.text || this.text.length == 0) {
            return [];
        }

        return this.tex.vertices(camera, 97, new Rect(0, 0, this.tex.width, this.tex.height),
            new Rect(this.pos.x + this.offset.x, this.pos.y + this.offset.y, this.tex.width, this.tex.height));
    }


}    
