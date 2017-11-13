import { Actor } from '../../lage/actor'
import { Engine } from '../../lage/engine'
import { Text } from '../../lage/text'

export class Indy extends Actor { 
    constructor(name: string, engine: Engine, text: Text) { 
        super('Indy', engine, text);
        console.log(`new actor ${this.name}`);
    }
}