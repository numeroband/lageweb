import { Point, Rect } from './common';
import { Text } from './text';
import { Costume } from './costume';
import { Room } from './room';
import { Box } from './box';
import { Renderable } from './renderer';
import { Texture } from './texture';

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

export class Actor implements Renderable {
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
    
    constructor(readonly name: string, private room: Room, private text: Text) { 
        room.actors.push(this);
    }

    vertices(camera: Rect): number[] {
        if (!this.currentCostume) {
            return [];
        }

        return this.currentCostume.vertices(camera);
    }

    update() {
        if (this.currentCostume) {
            this.currentCostume.update(this.pos, this.box.mask, this.box.getScale(this.pos.y), (this.pos.x % 256) / 255);
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
    
    setAnimation(anim: Animation)
    {
        if (!this.currentCostume)
        {
            return;
        }
        
        this.currentCostume.setAnimation(anim + this.direction, this.direction == Direction.West);
    }    
}