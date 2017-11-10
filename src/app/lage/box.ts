import { Point, Rect } from './common';
import * as Geometry from './geometry';
// import { Clipper, PolyType, Paths } from 'clipper';

export class ScaleSlot
{
    public y: [number, number];
    public scale: [number, number];

    constructor(slotData: any | number) {
        if (isNaN(slotData)) {
            this.y = [slotData['y1'], slotData['y2']];
            this.scale = [slotData['scale1'], slotData['scale2']];
        } else {
            this.y = [0, 0];
            this.scale = [slotData, slotData];
        }
    }
};

export class Box {
    readonly mask: number;
    readonly flags: number;
    
    private points: Point[];
    private scaleSlot: ScaleSlot;
    private neighbors: Box[];
    
    constructor(boxJson: any, slots: ScaleSlot[]) {
        this.points = [];
        boxJson['box'].forEach((pointData: any) => {
            const point = new Point(pointData[0], pointData[1])
            if (!this.points.find(p => point.equals(p))) {
                this.points.push(point);
            }            
        });
        
        this.flags = boxJson['flags'];
        this.mask = boxJson['mask'];
        
        const scale = boxJson['scale'];
        if (scale) {
            this.scaleSlot = new ScaleSlot(scale);
        } else {
            this.scaleSlot = slots[boxJson['scaleSlot']];            
        }            
    }

    getScale(y: number): number {
        if (this.scaleSlot.y[0] == this.scaleSlot.y[1])
        {
            return this.scaleSlot.scale[0] / 255.0;
        }
        
        let s = ((this.scaleSlot.scale[1] - this.scaleSlot.scale[0]) * (y - this.scaleSlot.y[0])) /
            (this.scaleSlot.y[1] - this.scaleSlot.y[0]) + this.scaleSlot.scale[0];
        if(s > 255) {
            s = 255;
        }

        if(s < 1) {
            s = 1;
        }
        
        return s / 255.0;
    }    

    contains(p: Point): boolean {
        return Geometry.inContour(p, this.points) || Geometry.pointInside(p, this.points);        
    }

    comparableDistance(p: Point): number {
        const {dist} = this.closestPoint(p);
        return dist;
    }

    closestPoint(p: Point): {dist: number, closest: Point}
    {
        if (this.contains(p))
        {
            return {dist: 0, closest: p};
        }
        
        let minDistance = Number.MAX_SAFE_INTEGER;
        
        const size = this.points.length;
        let closest: Point = new Point();
        for (let i = 0; i < size; ++i)
        {
            const pc = Geometry.closestPoint(this.points[i], this.points[(i + 1) % size], p);
            const d = Geometry.comparableDistance(p, pc);
            if (d < minDistance)
            {
                minDistance = d;
                closest = pc;
            }
            // Avoid calculating the same line
            if (size == 2)
            {
                break;
            }
        }
        return {dist: minDistance, closest: closest};
    }
    
    
}