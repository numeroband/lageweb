import { HttpClient } from '@angular/common/http'

class FontChar {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;

    private char: number[][];

    constructor({char, offset, size}) {
        this.char = char;
        this.x = offset[0];
        this.y = offset[1];
        this.width = size[0];
        this.height = size[1];        
    }

    render(colors: number[][], pixels: Uint8Array, stride: number,
        startX: number, startY: number, color?: number[]) {

        const lineX = startX * 4 + this.x * 4;
        for (let i = 0; i < this.height; ++i) {
            const lineY = startY + this.y + i;
            const lineStart = lineY * 4 * stride + lineX;
            this.char[i].forEach((colorIdx, idx) => {
                const colorOutput = ((color && colorIdx == 1) ? color : colors[colorIdx]);
                if (!colorOutput) {
                    return;
                }
                colorOutput.forEach((col, i) => {
                    pixels[lineStart + (colorOutput.length * idx) + i] = col;                    
                });
            });            
        }
    }
}

export class Font {
    private height: number;
    private colors: number[][];
    private chars: {[key: number]: FontChar};
    
    constructor(readonly name: string) { }
    
    private createCharset({height, colors, chars}) {
        this.height = height;
        this.colors = [null].concat(colors.map(color => [color[0], color[1], color[2], 255]));
        this.chars = {};
        for (const c in chars) {
            this.chars[c] = new FontChar(chars[c]);
        }
    }

    load(http: HttpClient): Promise<void> {
        if (this.chars) {
            return Promise.resolve();
        }
        
        return http.get<any>(`assets/fonts/${this.name}.json`).toPromise()
            .then(charset => this.createCharset(charset));
    }

    getTextRect(text: string): {x: number, y: number, width:number, height: number}
    {
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

    render(text: string, pixels: Uint8Array, stride: number, x: number, y: number, color?: number[]) {
        for (let i = 0; i < text.length; ++i) {
            const char: FontChar = this.chars[text.charCodeAt(i)];
            char.render(this.colors, pixels, stride, x, y, color);
            x += char.x + char.width;
        }
    }
}
