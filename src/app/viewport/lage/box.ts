import { Point, Rect } from './common';

import { Clipper, PolyType, Paths } from 'clipper';

export class ScaleSlot
{
    public y: [number, number];
    public scale: [number, number];
};

export class Box {
    readonly mask: number;
    readonly flags: number;
    
    private points: Point[];
    private scaleSlot: ScaleSlot;
    private neighbors: Box[];
    
    constructor(boxJson: any, slots: ScaleSlot[]) { 
        const cpr = new Clipper();
        const paths = [[{X:10,Y:10},{X:110,Y:10},{X:110,Y:110},{X:10,Y:110}],
                     [{X:20,Y:20},{X:20,Y:100},{X:100,Y:100},{X:100,Y:20}]];;
        cpr.AddPaths(paths, PolyType.ptSubject, true);
    }
}