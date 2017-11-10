import { Point } from './common'
import { ScaleSlot, Box } from './box'

export class Boxes {
    private boxes: Box[];

    constructor(boxesData: any, slotsData: any) {
        const slots = slotsData.map((slotData: any) => new ScaleSlot(slotData));
        this.boxes = boxesData.map((boxData: any) => new Box(boxData, slots));    
        // Ignore the first box
        this.boxes.shift();
    }

    getBoxIn(pos: Point): Box | undefined {
        return this.boxes.find(box => box.contains(pos));
    }

    getClosestBox(pos: Point): {box: Box , point: Point}
    {
        let minDist = Number.MAX_VALUE;
        let closestBox: Box = this.boxes[0];
        
        this.boxes.forEach(box => {
            if (box.contains(pos))
            {
                return {'box': box, 'point': pos };
            }
            
            const dist = box.comparableDistance(pos);
            if (dist < minDist)
            {
                minDist = dist;
                closestBox = box;
            }
        });
        
        const {dist, closest} = closestBox.closestPoint(pos);

        return {box: closestBox, point: closest};
    }
    
}