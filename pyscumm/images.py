from bitparser import BitParser
from struct import unpack_from
from numpy import zeros, unpackbits, uint8
from textures import Texture

class ImageDecoder:
    def __init__(self, res, width, height, paletteOff, trans):
        self.res = res
        self.paletteOff = paletteOff
        self.img = Texture(width, height)
        self.trans = trans
        off = res.off + 8
        first = unpack_from('<I', res.data, off)[0]
        numStripes = (first - 8) / 4
        fmt = '{:d}I'.format(numStripes)
        offsets = unpack_from(fmt, res.data, off)
        off -= 8
        for i in range(0, len(offsets)):
            if i == (len(offsets) - 1):
                nextOffset = res.length
            else:
                nextOffset = offsets[i + 1]
            self.decodeStripe(off + offsets[i], nextOffset - offsets[i], i)
    #
    def writePixel(self, x0, height, pixel, color, n, checkTrans, column=False):
        if checkTrans and color == self.trans:
            return
        for i in range(pixel, pixel + n):
            if column:
                x = x0 + (i / height)
                y = i % height 
            else:
                x = x0 + (i % 8)
                y = i / 8
            self.img.putpixel((x,y),(
                self.res.data[self.paletteOff + (3 * color) + 0],
                self.res.data[self.paletteOff + (3 * color) + 1],
                self.res.data[self.paletteOff + (3 * color) + 2], 255))
    #
    def unkDecodeA(self, off, length, nStripe, decompShr, checkTrans):
        height = self.img.height
        x0 = nStripe * 8
        bits = BitParser(self.res.data, off, length)
        color = bits.read(8)
        inc = 0
        pixel = 0
        self.writePixel(x0, height, pixel, color, 1, checkTrans)
        pixel += 1
        while pixel < (8 * height):
            n = 1
            if bits.read(1):
                if not bits.read(1):
                    color = bits.read(decompShr)
                else:
                    inc = bits.read(3) - 4
                    if inc:
                        color += inc
                    else:
                        n = bits.read(8)
            self.writePixel(x0, height, pixel, color, n, checkTrans)
            pixel += n
    #
    def unkDecodeBC(self, off, length, nStripe, decompShr, checkTrans, column):
        height = self.img.height
        x0 = nStripe * 8
        bits = BitParser(self.res.data, off, length)
        color = bits.read(8)
        inc = -1
        pixel = 0
        self.writePixel(x0, height, pixel, color, 1, checkTrans, column)
        pixel += 1
        while pixel < (8 * height):
            if bits.read(1):
                if not bits.read(1):
                    color = bits.read(decompShr)
                    inc = -1
                else:
                    if bits.read(1):
                        inc = -inc
                    color += inc
            self.writePixel(x0, height, pixel, color, 1, checkTrans, column)
            pixel += 1
    #
    def decodeStripe(self, off, length, nStripe):
        stType = self.res.data[off] 
        decompShr = stType % 10
        decompMask = 0xFF >> (8 - decompShr)
        # print('st {:d}, type: {:d} shr: {:d} mask: {:d}', nStripe, stType, decompShr, decompMask)
        if (stType >= 64 and stType <= 68) or (stType >= 104 and stType <= 108):
            self.unkDecodeA(off + 1, length - 1, nStripe, decompShr, False)
        if (stType >= 84 and stType <= 88) or (stType >= 124 and stType <= 128):
            self.unkDecodeA(off + 1, length - 1, nStripe, decompShr, True)
        if (stType >= 14 and stType <= 18) or (stType >= 34 and stType <= 38):
            self.unkDecodeBC(off + 1, length - 1, nStripe, decompShr, stType >= 34, True)
        if (stType >= 24 and stType <= 28) or (stType >= 44 and stType <= 48):
            self.unkDecodeBC(off + 1, length - 1, nStripe, decompShr, stType >= 44, False)

class MaskDecoder:
    def __init__(self, res, width, height):
        self.emptyMask = True
        self.res = res
        self.img = Texture(width, height, mask=True)
        off = res.off + 8
        first = unpack_from('<H', res.data, off)[0]
        numStripes = width / 8
        fmt = '{:d}H'.format(numStripes)
        offsets = unpack_from(fmt, res.data, off)
        off -= 8
        for i in range(0, len(offsets)):
            if i == (len(offsets) - 1):
                nextOffset = res.length
            else:
                nextOffset = offsets[i + 1]
            self.decodeStripe(off + offsets[i], nextOffset - offsets[i], i)
    #
    def decodeStripe(self, off, length, nStripe):
        stripeOff = off
        end = off + length
        x = 8 * nStripe
        y = 0
        while (stripeOff < end):
            count = self.res.data[stripeOff]
            stripeOff += 1
            if (count & 0x80):
                count &= 0x7F
                bits = unpackbits(uint8(self.res.data[stripeOff]))
                stripeOff += 1
                for j in range(0, count):
                    for k in range(0, 8):
                        if bits[k] == 1:
                            self.emptyMask = False
                            self.img.putpixel((x + k, y), 1)
                    y += 1
            else:
                for j in range(0, count):
                    bits = unpackbits(uint8(self.res.data[stripeOff]))
                    stripeOff += 1
                    for k in range(0, 8):
                        if bits[k] == 1:
                            self.emptyMask = False
                            self.img.putpixel((x + k, y), 1)
                    y += 1
