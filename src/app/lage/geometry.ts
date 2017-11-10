import { Point } from './common';

export function inSegment(p: Point, p0: Point, p1: Point): boolean
{
    if (p.x < Math.min(p0.x, p1.x) ||
        p.x > Math.max(p0.x, p1.x) ||
        p.y < Math.min(p0.y, p1.y) ||
        p.y > Math.max(p0.y, p1.y))
    {
        return false;
    }
    
    if ((p0.x == p1.x) || (p0.y == p1.y))
    {
        return true;
    }
    
    const m = (p1.y - p0.y) / (p1.x - p0.x);        
    const y = m * (p.x - p0.x) + p0.y;
    
    return y > (p.y - 2) && y < (p.y + 2);
}

export function inContour(p: Point, points: Point[]): boolean
{
    const size = points.length;
    for (let i = 0; i < size; ++i)
    {
        if (inSegment(p, points[i], points[(i + 1) % size]))
        {
            return true;
        }
        
        if (size == 2)
        {
            break;
        }
    }
    
    return false;
}

export function comparableDistance(p0: Point, p1: Point) {
    const x = p0.x - p1.x;
    const y = p0.y - p1.y;
    return x * x + y * y;
}

export function pointInside(point: Point, polygon: Point[]) {
    // const epsilon = 0.5f;
    let inside = false;

    // Must have 3 or more edges
    if (polygon.length < 3) return false;

    let oldPoint = polygon[polygon.length - 1];
    let oldSqDist = comparableDistance(oldPoint, point);

    for (let i = 0; i < polygon.length; i++)
    {
        const newPoint = polygon[i];
        const newSqDist = comparableDistance(newPoint, point);

        //            if (oldSqDist + newSqDist + 2.0f * System.Math.Sqrt(oldSqDist * newSqDist) - Vector2.DistanceSquared(newPoint, oldPoint) < epsilon)
        //                return toleranceOnOutside;

        const left = (newPoint.x > oldPoint.x) ? oldPoint : newPoint;
        const right = (newPoint.x > oldPoint.x) ? newPoint : oldPoint;

        if (left.x < point.x && point.x <= right.x && 
            (point.y - left.y) * (right.x - left.x) < (right.y - left.y) * (point.x - left.x))
        {
            inside = !inside;
        }

        oldPoint = newPoint;
        oldSqDist = newSqDist;
    }

    return inside;
}

export function closestPoint(A: Point, B: Point, P: Point)
    {
        const AP = new Point(P.x - A.x, P.y - A.y);
        const AB = new Point(B.x - A.x, B.y - A.y);
        const ab2 = AB.x * AB.x + AB.y * AB.y;
        const ap_ab = AP.x * AB.x + AP.y * AB.y;
        const t = ap_ab / ab2;
        
        if (t < 0.0)
        {
            return A;
        }
        
        if (t > 1.0)
        {
            return B;
        }
        
        return new Point(A.x + Math.round(AB.x * t), A.y + Math.round(AB.y * t));
    }

