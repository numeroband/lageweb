from bitparser import BitParser
from struct import unpack_from
from numpy import zeros, unpackbits, uint8
from textures import Texture, packTextures
import json
import re

class Character:
    def __init__(self, charset, off):
        self.charset = charset
        (self.width,
            self.height,
            self.offX,
            self.offY) = unpack_from('<BBbb', charset.res.data, off)
        off += 4
        numBytes = (((self.width * self.height * charset.bpp) + 7) & ~7) >> 3
        self.char = zeros((self.height, self.width), dtype=uint8)
        x = 0
        y = 0
        while y < self.height:
            b = charset.res.data[off]
            off += 1
            for i in reversed(range(8 / charset.bpp)):
                self.char[y,x] = (b >> (i * charset.bpp)) & ((1 << charset.bpp) - 1)
                x += 1
                if x >= self.width:
                    y += 1
                    x = 0
                if y >= self.height:
                    break
    #
    def size(self):
        return (self.width + self.offX, self.height + self.offY)
    #
    def render(self, img, x0, y0):
        for x in range(self.width):
            for y in range(self.height):
                color = self.charset.palette[self.char[y, x] - 1]
                if self.char[y, x] != 0:
                    img.putpixel((self.offX + x0 + x, self.offY + y0 + y), (
                        self.charset.res.data[self.charset.paletteOff + (3 * color) + 0],
                        self.charset.res.data[self.charset.paletteOff + (3 * color) + 1],
                        self.charset.res.data[self.charset.paletteOff + (3 * color) + 2], 255))
    #
    def toDict(self):
        return { 
            'size': [self.width, self.height],
            'offset': [self.offX, self.offY],
            'char': self.char.tolist()
        }
    #
    def __repr__(self):
        j = json.dumps(self.toDict(), indent=2, sort_keys=True)
        j = re.sub('\n\s+(-?\d+),','\g<1>,',j)
        j = re.sub('\n\s+(-?\d+)\n\s+]','\g<1>]',j)
        return j

class Charset:
    def __init__(self, res, paletteOff):
        self.res = res
        self.paletteOff = paletteOff
        off = res.off + 8
        (self.size, self.version) = unpack_from('<IH', res.data, off)
        off += 6
        self.palette = res.data[off:(off+15)]
        off += 15
        self.offStart = off
        (self.bpp, self.height, self.numChars) = unpack_from('<BBH', res.data, off)
        off += 4
        self.offsets = unpack_from('<{:d}I'.format(self.numChars), res.data, off)
        self.chars = {k: Character(self, self.offStart + v) for k, v in enumerate(self.offsets) if v}
    #
    def render(self, text, img, x, y):
        (width, height) = reduce(lambda x, y: (x[0] + y[0], x[1] + y[1]), [self.chars[ord(c)].size() for c in text])
        offX = 0
        for c in text:
            char = self.chars[ord(c)]
            char.render(img, x + offX, y)
            (w, h) = char.size() 
            offX += w
    #        
    def toDict(self):
        return { 
            'height': self.height,
            'colors': [[self.res.data[self.paletteOff + (3 * color) + 0],
                        self.res.data[self.paletteOff + (3 * color) + 1],
                        self.res.data[self.paletteOff + (3 * color) + 2]] 
                        for color in self.palette[0:(1 << self.bpp)]],
            'chars': {k: v.toDict() for k, v in self.chars.iteritems()}
        }    
    #
    def __repr__(self):
        j = json.dumps(self.toDict(), indent=2, sort_keys=True)
        j = re.sub('\n\s+(-?\d+),','\g<1>,',j)
        j = re.sub('\n\s+(-?\d+)\n\s+]','\g<1>]',j)
        return j

