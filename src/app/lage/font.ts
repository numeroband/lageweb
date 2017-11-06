import { Resources } from './resources'
import { Texture } from './texture'

class FontChar {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;

    private char: number[][];

    constructor({char, offset, size}: {char: number[][], offset: number[], size: number[]}) {
        this.char = char;
        this.x = offset[0];
        this.y = offset[1];
        this.width = size[0];
        this.height = size[1];        
    }

    render(colors: (number[]|null)[], tex: Texture, startX: number, startY: number, color?: number[]) {
        for (let y = 0; y < this.height; ++y) {
            this.char[y].forEach((colorIdx, x) => {
                const colorOutput = ((color && colorIdx == 1) ? color : colors[colorIdx]);
                if (colorOutput) {
                    tex.setColor(startX + this.x + x, startY + this.y + y, 
                        colorOutput[0], colorOutput[1], colorOutput[2], colorOutput[3]);
                }
            });            
        }
    }
}

export class Font {
    private height: number;
    private colors: (number[]|null)[];
    private chars: {[key: string]: FontChar};
    
    constructor(readonly name: string) { }
    
    private createCharset({height, colors, chars}: {height: number, colors: number[][], chars: any}) {
        this.height = height;
        this.colors = [null];
        this.colors = this.colors.concat(colors.map(color => [color[0], color[1], color[2], 255]));
        this.chars = {};
        for (const c in chars) {
            this.chars[c] = new FontChar(chars[c]);
        }
    }

    load(resources: Resources): Promise<void> {
        if (this.chars) {
            return Promise.resolve();
        }
        
        return resources.loadFont(this.name)
            .then(charset => this.createCharset(charset));
    }

    getTextRect(text: string): {x: number, y: number, width:number, height: number} {
        let minX = 0;
        let minY = 0;
        let maxW = 0;
        let maxH = 0;
        let first = true;
        
        for (let i = 0; i < text.length; ++i) {
            const char: FontChar = this.chars[text.charCodeAt(i)];

            if (!char) {
                continue;
            }

            if (char.y < minY) {
                minY - char.y;
            }

            if (first && char.x < minX) {
                first = false;
                minX = char.x;
            }

            const width = char.x + char.width;
            const height = char.y + char.height;
            maxW += width;
            if (height > maxH)
            {
                maxH = height;
            }            
        }

        return {x: minX, y: minY, width: maxW - minX, height: maxH - minY};
    }

    render(text: string, tex: Texture, x: number, y: number, color?: number[]) {
        for (let i = 0; i < text.length; ++i) {
            const char: FontChar = this.chars[text.charCodeAt(i)];
            char.render(this.colors, tex, x, y, color);
            x += char.x + char.width;
        }
    }
}
