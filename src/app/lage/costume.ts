import { Texture } from './texture';
import { Renderer, Renderable } from './renderer';
import { Point, Rect } from './common';
import { Resources } from './resources';

enum Command
{
    Stop = 0x79,
    Start = 0x7a,
};

class Frame
{
    move: Point;
    clip: Rect;
    rel: Point;

    constructor (move: number[], clip: number[], rel: number[]) {
        this.move = new Point(move[0], move[1]);
        this.clip = new Rect(clip[0], clip[1], clip[2], clip[3]);
        this.rel = new Point(rel[0], rel[1]);
    }
};

class Limb
{
    constructor(public frames: number[] = [],
                public noLoop: boolean = false) { }
};

const NUM_LIMBS = 16;

export class Costume implements Renderable {
    public tex: Texture;
    public rect: Rect = new Rect(0, 0, 0, 0);

    private speed: number;
    private frames: {[key: string]: {[limbId: string]: Frame}} = {};
    private animations: {[animId: string]: {[limbId: string]: Limb}} = {};
    private currentAnimation: {[limbId: string]: Limb} = {};
    private currentFrames: Frame[] = [];
    private pos: Point = new Point(0, 0);
    private z: number;
    private flip: boolean;
    private scale: number;
    private light: number;
    private numFrames: number;
    private stopped: number = 0;

    constructor(private name: string) { }

    private loadFrames(frames: any) {
        for (const key in frames) {
            const limb: {[key: string]: Frame} = {};
            this.frames[key] = limb;
            const limbData = frames[key];
            for (const limbKey in limbData) {
                const {move, texture, rel} = limbData[limbKey]; 
                limb[limbKey] = new Frame(move, texture, rel);
            }
        }
    }

    private loadAnimations(animation: any) {
        for (const animId in animation) {
            const limbs: {[key: string]: Limb} = {};
            this.animations[animId] = limbs;
            // It's a 1 element array
            const animData = animation[animId][0];
            for (const animKey in animData) {
                const { frames, noLoop } = animData[animKey];
                const limb = new Limb(frames, noLoop);
                limbs[animKey] = limb;
            }
        }
    }

    update(pos: Point, z: number, scale: number, light: number) {
        this.scale = scale;
        this.light = light;
        this.pos = pos;
        this.z = z;

        let ul = new Point(Number.MAX_VALUE, Number.MAX_VALUE);
        let lr = new Point(0, 0);

        this.currentFrames = [];

        for (let i = NUM_LIMBS; i > 0; --i) {
            const limbId = i - 1;
            if (this.stopped & (1 << limbId))
            {
                continue;
            }

            const limb = this.currentAnimation[limbId];
            if (limb === undefined) {
                continue;
            }

            const animationFrame = Math.floor(this.numFrames / 6) % limb.frames.length;
            const frameId = limb.frames[animationFrame];
            const limbFrames = this.frames[limbId];
            const frame = limbFrames[frameId];
            if (frame !== undefined) {
                this.currentFrames.push(frame);
                const limbRect = new Rect();
                const rel = Object.assign({}, frame.rel);

                if (this.flip) {
                    rel.x = -(rel.x + frame.clip.w);
                }
                
                limbRect.x = Math.floor(rel.x * this.scale);
                limbRect.y = Math.floor(rel.y * this.scale);
                limbRect.w = Math.ceil(frame.clip.w * scale);
                limbRect.h = Math.ceil(frame.clip.h * scale);

                if (limbRect.x < ul.x) {
                    ul.x = limbRect.x;
                }

                if (limbRect.y < ul.y) {
                    ul.y = limbRect.y;
                }

                if (limbRect.x + limbRect.w > lr.x) {
                    lr.x = limbRect.x + limbRect.w;
                }

                if (limbRect.y + limbRect.h > lr.y) {
                    lr.y = limbRect.y + limbRect.h;
                }
            }      
        }

        this.rect.x = this.pos.x + ul.x;
        this.rect.y = this.pos.y + ul.y;
        this.rect.w = lr.x - ul.x;
        this.rect.h = lr.y - ul.y;
        ++this.numFrames;
    }

    load(resources: Resources, renderer: Renderer): Promise<any> {
        this.tex = renderer.newTexture();
        return Promise.all([
            this.tex.fromImage(this.name),
            resources.loadJson(this.name)
                .then(({frames, animations}) => {
                    this.loadFrames(frames);
                    this.loadAnimations(animations); 
                })
        ]);
    }

    setAnimation(animation: number, flip: boolean) {
        this.numFrames = 0;
        this.flip = flip;
        const limbs = this.animations[animation];
        console.log("********* Set animation " + animation);
        for (const limbId in limbs)
        {
            const limb = limbs[limbId];
            const frameId = limb.frames[0];
            switch (frameId)
            {
                case Command.Stop:
                    console.log(limbId + ": STOP");
                    this.stopped |= (1 << Number(limbId));
                    break;
                case Command.Start:
                    console.log(limbId + ": START");
                    this.stopped &= ~(1 << Number(limbId));
                    break;
                default:
                    console.log(limbId + ": frame ");
                    this.currentAnimation[limbId] = limb;
                    break;
            }
        }
    }
    
    reset()
    {
        this.stopped = 0;
        this.currentAnimation = {};
    }

    vertices(camera: Rect): number[] {
        const pos = new Point(this.pos.x - camera.x, this.pos.y - camera.y);
        const ret = [];

        for (const frame of this.currentFrames)
        {
            const rect = Object.assign({}, frame.clip);
            const rel = Object.assign({}, frame.rel);
            
            if (this.flip)
            {
                rel.x = -(rel.x + rect.w);
            }
            
            const limbPos = new Rect(this.pos.x + Math.floor(rel.x * this.scale), 
            this.pos.y + Math.floor(rel.y * this.scale));
            
            if (limbPos.x < camera.w && limbPos.x + rect.w > camera.w)
            {
                rect.w -= (limbPos.x + rect.w - camera.w);
            }
            
            if (limbPos.y < camera.h && limbPos.y + rect.h > camera.h)
            {
                rect.h -= (limbPos.y + rect.h - camera.h);
            }

            limbPos.w = rect.w * this.scale;
            limbPos.h = rect.h * this.scale;
            
            //this.texture->setColor(this.light, this.light, this.light);
            ret.push(...this.tex.vertices(camera, this.z, rect, limbPos, this.flip));
        }

        return ret;
    }
}

