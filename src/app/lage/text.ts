import { Renderer } from './renderer';
import { Texture } from './texture';
import { Font } from './font';
import { Point, Rect } from './common';

export class Text {
    public pos: Point = new Point();
    public text: string | undefined;
    public font: Font | undefined;

    private offset: Point = new Point(0, 0);

    constructor(readonly tex: Texture) { }

    setText(text?: string, font?: Font, color?: number[]) {
        if (this.text === text && font === this.font) {
            return;
        }
        this.text = text;
        this.font = font;

        if (!text || !font) {
            return;
        }

        const {x, y, width, height} = font.getTextRect(text);
        this.tex.newSurface(width, height);
        font.render(text, this.tex, -x, -y, color);
        this.tex.fromSurface();
        this.offset.x = x;
        this.offset.y = y;
    }

    render(renderer: Renderer, camera: Rect) {
        if (!this.text || this.text.length == 0) {
            return;
        }

        const vertices = this.tex.vertices(97, new Rect(0, 0, this.tex.width, this.tex.height),
            new Rect(this.pos.x + this.offset.x, this.pos.y + this.offset.y, this.tex.width, this.tex.height));
        renderer.render(this.tex, vertices, camera);
    }


}    
