import { Engine } from '../../lage/engine'
import { Room } from '../../lage/room'
import { Objeto } from '../../lage/objeto'
import { Renderer } from '../../lage/renderer'
import { Actor } from '../../lage/actor'
import { Text } from '../../lage/text'
import { Point } from '../../lage/common'

export class Atlantis_09 extends Room {
	constructor(engine: Engine) {
		super('Atlantis_09', engine);
	}

	protected onLoad(renderer: Renderer): void {
		this.currentActor = new Actor('Indy', this, new Text(renderer.newTexture()));
		this.currentActor.setPosition(new Point(100, 100));
		this.currentActor.setCostume('Atlantis_00_Cost03');
	}
}

/*
export class Atlantis_09 extends Room {
	constructor(engine: Engine) {
		super(engine, 'Atlantis_09');
	}

	defaultState(): any {
		return {			
		} 
	}

	enter(): void {
		console.log(`enter ${this.name}`)
		const actor = this.engine.newActor('Indy')
		actor.setCostume('Atlantis_00_Cost03')
		actor.atObject(this.objects.taxi)
		actor.faceAgainstObject(this.objects.taxi)
		actor.setCurrent()
	}

	exit(): void {
		console.log(`exit ${this.name}`)
	}
	
	objects = {
		phoneBooth: new class extends Objeto {
			costume = 'Atlantis_00_Cost03'
			defaultVerb = 'Close'

			verbUse() {
				if (this.costume === 'Monkey2_03_Cost00') {
					this.costume = 'Atlantis_00_Cost03'
				} else {
					this.costume = 'Monkey2_03_Cost00'
				}
				this.engine.currentActor.setCostume(this.costume)
			}

			verbOpen() {
				if (this.state === 1) {
					this.state = 0
					this.defaultVerb = 'Close'
				}
			}

			verbClose() {
				if (this.state === 0) {
					this.state = 1
					this.defaultVerb = 'Open'
				}
			}
		}(this.engine),

		newspaper: new class extends Objeto {
			defaultVerb = 'LookAt'
			verbLookAt() {
				this.engine.currentActor.say('This is just a newspaper')
			}
		}(this.engine),

		taxi: new class extends Objeto {
			defaultVerb = 'Use'
			async verbUse() {
				await this.engine.currentActor.say('To Central Station, please')
				this.engine.currentActor.say('... or maybe not')
			}
		}(this.engine),

		backDoor: new class extends Objeto {
			defaultVerb = 'Open'
	
			verbOpen() {
				if (this.state === 0) {
					this.state = 1
					this.defaultVerb = 'Close'
				}
			}

			verbClose() {
				if (this.state === 1) {
					this.state = 0
					this.defaultVerb = 'Open'
				}
			}

			verbWalkTo() {
				if (this.state === 1) {
					this.engine.newRoom('Monkey2_06')
				}
			}
		}(this.engine),
		
	}
}
*/
