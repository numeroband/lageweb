import { Point, Rect } from './common';
import { Text } from './text';
import { Costume } from './costume';
import { Room } from './room';

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
    private walkNumFrames: number;
    private walkOrigin: Point;
    private path: Point[];
    private pos: Point;
    private currentCostume: Costume;
    private direction: Direction;
    private scale: number;
    private light: number;
    // private box: Box;
    private initAnimation: number;
    private walkAnimation: number;
    private standAnimation: number;
    private talkStartAnimation: number;
    private talkStopAnimation: number;
    private textFramesPending: number;
    // private std::function<void()> _exit;
    // private std::function<void(bool)> _arrived;
    // private std::function<void(bool)> _talked;

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
    
    constructor(readonly name: string, private room: Room, private text: Text) { }


}