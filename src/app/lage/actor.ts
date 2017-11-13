import { Point, Rect } from './common';
import { Text } from './text';
import { Costume } from './costume';
import { Room } from './room';
import { Box } from './box';
import { Renderer } from './renderer';
import { Texture } from './texture';
import { Engine } from './engine';

export enum Direction
{
    West,
    East,
    South,
    North,
    NumDirections,
    NoDirection,
};

export enum Animation
{
    Init = 4,
    Walk = 8,
    Stand = 12,
    TalkStart = 16,
    TalkStop = 20,
};

export class Actor {
    private framesPerPixel: Point;
    private walkFrame: number;
    private walkNumFrames: number = 0;
    private walkOrigin: Point;
    private path: Point[];
    private pos: Point;
    private currentCostume: Costume;
    private direction: Direction = Direction.East;
    private scale: number = 1.0;
    private light: number;
    private box: Box;
    private initAnimation: number = Animation.Init;
    private walkAnimation: number = Animation.Walk;
    private standAnimation: number = Animation.Stand;
    private talkStartAnimation: number = Animation.TalkStart;
    private talkStopAnimation: number = Animation.TalkStop;
    private textFramesPending: number = 0;
    private talkResolve: (() => void) | undefined;
    private talkReject: (() => void) | undefined;
    private room: Room;
    // private std::function<void()> _exit;
    // private std::function<void(bool)> _arrived;
    // private std::function<void(bool)> _talked;

    get tex(): Texture { 
        return this.currentCostume.tex; 
    }

    public static reverseDirection(direction: Direction): Direction {
        switch (direction)
        {
            case Direction.West:
                return Direction.East;
            case Direction.East:
                return Direction.West;
            case Direction.North:
                return Direction.South;
            case Direction.South:
                return Direction.North;
            default:
                return Direction.NoDirection;
        }        
    }
    
    constructor(readonly name: string, private engine: Engine, private text: Text) { 
        if (!engine.room) {
            throw new Error('No room in engine');
        }
        this.room = engine.room;
        this.room.actors.push(this);
    }

    render(renderer: Renderer, camera: Rect) {
        if (this.currentCostume) {
            this.currentCostume.render(renderer, camera);
        }

        if (this.textFramesPending > 0) {
            this.text.render(renderer, camera);
        }
    }

    update() {
        if (this.currentCostume) {
            this.currentCostume.update(this.pos, this.box.mask, this.box.getScale(this.pos.y), (this.pos.x % 256) / 255);
        }

        if (this.textFramesPending && --this.textFramesPending == 0) {
            this.text.setText();
            this.setAnimation(this.talkStopAnimation);
            if (this.talkResolve) {
                this.talkResolve();
            }
            this.talkResolve = undefined;
            this.talkReject = undefined;
        }
    }

    setPosition(pos: Point)
    {
        const {box, point} = this.room.boxes.getClosestBox(pos);
        this.box = box;
        this.pos = point;
        this.scale = box.getScale(point.y);
    }

    setCostume(name: string) {
        this.currentCostume = this.room.costumes[name];
        this.resetCostume();
    }

    resetCostume() {
        if (!this.currentCostume)
        {
            return;
        }
        
        this.currentCostume.reset();
        this.setAnimation(this.initAnimation);
    }
    
    setAnimation(anim: Animation) {
        if (!this.currentCostume)
        {
            return;
        }
        
        this.currentCostume.setAnimation(anim + this.direction, this.direction == Direction.West);
    }    

    say(text: string): Promise<void> {
        this.text.setText(text, this.engine.talkFont());
        this.textFramesPending = text.length * 6;
        const rect = this.currentCostume.rect;
        this.text.pos.x = rect.x - 10;
        this.text.pos.y = rect.y - 10;
        this.setAnimation(this.talkStartAnimation);
        return new Promise<void>((resolve, reject) => {
            this.talkResolve = resolve;
            this.talkReject = reject;            
        });
    }  
}