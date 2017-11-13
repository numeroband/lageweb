import * as Rooms from './rooms/rooms';
import * as Actors from './actors/actors';

import { Engine } from '../lage/engine';
import { Room } from '../lage/room';
import { Actor } from '../lage/actor';
import { Text } from '../lage/text';
import { Point } from '../lage/common';
import { Cursor } from '../lage/cursor';
import { Font } from '../lage/font';

export class Santa extends Engine {
    protected fonts: {[name: string]: Font} = {};

    private createFont(name: string) {
        let font = this.fonts[name];
    
        if (!font) {
            font = new Font(name);
            this.fonts[name] = font;
        }
    
        return font.load(this.resources);
    }
    
    createResolution() {
        return new Point(320, 200);
    }

    init(): Promise<void> {
        this.cursor = new Cursor(this.renderer.newTexture());        
        return Promise.all([
            this.createFont('Atlantis_65_Charset_00'),
            this.createFont('Atlantis_65_Charset_01'),
        ]).then(() => {
            return this.enterRoom('Atlantis_09');
        });
    }

    newRoom(name: string): Room {
        const roomClass: any = (Rooms as any)[name];
        return new roomClass(this) as Room;
    }

    newActor(name: string): Actor {
        if (!this.room) {
            throw new Error('No room in engine!!!!');
        }
        const text = new Text(this.renderer.newTexture());
        if (name in Actors) {
            const actorClass: any = (Actors as any)[name];
            return new actorClass(name, this, text);
        } else {
            return new Actor(name, this, text);
        }
    }

    talkFont(): Font {
        return this.fonts['Atlantis_65_Charset_01'];
    }
}


