import { Texture } from './texture';

const NUM_FRAMES = 3;
const REPEAT_FIRST = 2;
const TICKS_PER_FRAME = Math.floor(50 / (NUM_FRAMES + REPEAT_FIRST));

export class Cursor {
    private x: number = 0;
    private y: number = 0;
    private frame: number = 0;
    
    constructor(private tex: Texture) { }

    load(gl: WebGLRenderingContext): Promise<void> {
        return this.tex.load(gl);
    }

    update(mouseX: number, mouseY: number) {
        const frameSize = this.tex.width / NUM_FRAMES;
        this.x = mouseX - Math.floor(frameSize / 2);
        this.y = mouseY - Math.floor(frameSize / 2);
    }

    vertices() {
        const frameSize = this.tex.width / NUM_FRAMES;
        let animFrame = Math.floor(this.frame / TICKS_PER_FRAME);
        // Repeat anim frame 0
        animFrame = (animFrame > REPEAT_FIRST) ? (animFrame - REPEAT_FIRST) : 0;        
        const texX = frameSize * animFrame;
        const texY = 0;
        this.frame = (this.frame + 1) % ((NUM_FRAMES + REPEAT_FIRST) * TICKS_PER_FRAME);

        return this.tex.vertices(100, texX, texY, frameSize, frameSize, 
                this.x, this.y);
    }    
}    
