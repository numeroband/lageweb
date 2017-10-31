import { Point, Rect } from './common';
import { Renderable } from  './renderer';
import { Texture } from './texture';

const NUM_FRAMES = 3;
const REPEAT_FIRST = 2;
const TICKS_PER_FRAME = Math.floor(50 / (NUM_FRAMES + REPEAT_FIRST));

export class Cursor implements Renderable {
    public enabled: boolean = true;

    private pos: Point = new Point(0, 0);
    private frame: number = 0;
    
    constructor(readonly tex: Texture) { }

    update(mouse: Point) {
        const frameSize = this.tex.width / NUM_FRAMES;
        this.pos.x = mouse.x - Math.floor(frameSize / 2);
        this.pos.y = mouse.y - Math.floor(frameSize / 2);
    }

    vertices(camera: Rect) {
        if (!this.enabled) {
            return [];
        }
        
        const frameSize = this.tex.width / NUM_FRAMES;
        let animFrame = Math.floor(this.frame / TICKS_PER_FRAME);
        // Repeat anim frame 0
        animFrame = (animFrame > REPEAT_FIRST) ? (animFrame - REPEAT_FIRST) : 0;        
        const texX = frameSize * animFrame;
        const texY = 0;
        this.frame = (this.frame + 1) % ((NUM_FRAMES + REPEAT_FIRST) * TICKS_PER_FRAME);

        return this.tex.vertices(camera, 99, new Rect(texX, texY, frameSize, frameSize), 
                new Rect(this.pos.x, this.pos.y, frameSize, frameSize));
    }    
}    
