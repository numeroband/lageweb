import { Point, Rect } from './common';
import { Renderer } from  './renderer';
import { Texture } from './texture';

const CURSOR_SIZE = 13;
const CURSOR_COLORS = [0xFF, 0xAA, 0x55];
const NUM_FRAMES = CURSOR_COLORS.length;
const REPEAT_FIRST = 2;
const TICKS_PER_FRAME = Math.floor(50 / (NUM_FRAMES + REPEAT_FIRST));

export class Cursor {
    public enabled: boolean = true;

    private pos: Point = new Point(0, 0);
    private frame: number = 0;
    
    private drawCross(x: number, y: number, size: number, color: number) {
        for (let i = 0; i < Math.floor(size / 2) - 1; ++i) {
            this.tex.setColor(x + i, y + Math.floor(size / 2), color, color, color, 0xFF);
            this.tex.setColor(x + Math.floor(size / 2), y + i, color, color, color, 0xFF);
        } 
        for (let i = Math.floor(size / 2) + 2; i < size; ++i) {
            this.tex.setColor(x + i, y + Math.floor(size / 2), color, color, color, 0xFF);
            this.tex.setColor(x + Math.floor(size / 2), y + i, color, color, color, 0xFF);
        } 
    }
    constructor(readonly tex: Texture) {
        tex.newSurface(NUM_FRAMES * CURSOR_SIZE, CURSOR_SIZE);
        CURSOR_COLORS.forEach((color, idx) => this.drawCross(idx * CURSOR_SIZE, 0, CURSOR_SIZE, color));
        tex.fromSurface();
    }

    update(mouse: Point) {
        const frameSize = this.tex.width / NUM_FRAMES;
        this.pos.x = mouse.x - Math.floor(frameSize / 2);
        this.pos.y = mouse.y - Math.floor(frameSize / 2);
        this.frame = (this.frame + 1) % ((NUM_FRAMES + REPEAT_FIRST) * TICKS_PER_FRAME);
    }

    vertices() {
        const frameSize = this.tex.width / NUM_FRAMES;
        let animFrame = Math.floor(this.frame / TICKS_PER_FRAME);
        // Repeat anim frame 0
        animFrame = (animFrame > REPEAT_FIRST) ? (animFrame - REPEAT_FIRST) : 0;        
        const texX = frameSize * animFrame;
        const texY = 0;

        return this.tex.vertices(98, new Rect(texX, texY, frameSize, frameSize), 
                new Rect(this.pos.x, this.pos.y, frameSize, frameSize));
    }    

    render(renderer: Renderer) {
        if (!this.enabled) {
            return;
        }

        renderer.render(this.tex, this.vertices());
    }
}    
