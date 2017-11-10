import * as Rooms from './rooms/rooms';

import { Engine } from '../lage/engine';
import { Room } from '../lage/room';
import { Point } from '../lage/common';

export class Santa extends Engine {
    createResolution() {
        return new Point(320, 200);
    }

    didInit(): Promise<void> {
        return this.enterRoom('Atlantis_09');
    }

    newRoom(name: string): Room {
        const roomClass: any = (Rooms as any)[name];
        return new roomClass(this) as Room;
    }
}


