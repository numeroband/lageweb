export class Point {
    constructor(public x: number = 0, public y: number = 0) { }
    equals(p: Point) {
        return this.x == p.x && this.y == p.y;
    }
}

export class Rect {
    constructor(public x: number = 0, public y: number = 0, 
        public w: number = 0, public h: number = 0) { }
}
