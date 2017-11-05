declare module "clipper" {
    export enum PolyType {
		ptSubject = 0,
		ptClip = 1
	}

    export class DoublePoint {
        public X: number;
        public Y: number;
    }

    type Path = DoublePoint[];
    type Paths = Path[];

    export class Clipper {
        AddPaths(paths: Paths, polyType: PolyType, closed: boolean);
    }

}
