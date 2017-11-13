import { Point, Rect } from './common';
import { Font } from './font';

export interface Texture {
    readonly width: number;
    readonly height: number;
    
    fromImage(name: string): Promise<void>;
    newSurface(width: number, height:number): void;
    setColor(x: number, y: number, r: number, g: number, b: number, a: number): void;
    fromSurface(): void;
    vertices(z: number, src: Rect, dst: Rect, flip?: boolean): number[];
}
