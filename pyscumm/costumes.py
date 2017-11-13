from struct import unpack_from
from numpy import zeros, unpackbits, uint8
from textures import Texture, packTextures
import json
import re

class AnimationLimb:
    def __init__(self, res, cmdsOff, start, endOff):
        length = (endOff & 0x7F) + 1
        self.start = start
        self.end = endOff
        self.noLoop = endOff >> 7
        self.cmds = []
        for i in range(cmdsOff + start, cmdsOff + start + length):
            self.cmds.append(res.data[res.off + res.costOffStart + i])
    #
    def toDict(self):
        d = {'frames': self.cmds}
        if self.noLoop:
            d['noLoop'] = self.noLoop
        d['start'] = self.start
        d['end'] = self.end
        return d

class Animation:
    def __init__(self, res, animOff, cmdsOff):
        off = res.off + res.costOffStart + animOff
        self.mask = unpack_from('<H', res.data, off)[0]
        off += 2
        mask = self.mask
        self.limbs = [None] * 16
        for i in range(15, -1, -1):
            if (mask & 0x8000) != 0:
                start = unpack_from('<H', res.data, off)[0]
                off += 2
                if (start & 0x8000) == 0:
                    end = res.data[off]
                    off += 1
                    self.limbs[i] = AnimationLimb(res, cmdsOff, start, end)
            mask <<= 1
    #
    def toDict(self):
        return dict([(i[0], i[1].toDict()) for i in enumerate(self.limbs) if i[1]]),
class Picture:
    def __init__(self, res, pictOff, costume):
        off = res.off + res.costOffStart + pictOff
        (self.width,
            self.height,
            self.relX,
            self.relY,
            self.moveX,
            self.moveY) = unpack_from('HHhhhh', res.data, off)
        off += 12
        if (costume.format & 0x7F) == 0x60:
            (self.redirLimb, self.redirPict) = unpack_from('BB', res.data, off)
            off += 2
        x = 0
        y = 0
        if self.width == 0 or self.height == 0:
            return
        self.img = Texture(self.width, self.height)
        if len(costume.palette) == 16:
            shift = 4
            mask = 0xF
        else:
            shift = 3
            mask = 0x7
        while True:
            rep = res.data[off]
            off += 1
            color = rep >> shift
            rep &= mask
            if rep == 0:
                rep = res.data[off]
                off += 1
            while rep > 0:
                if color != 0:
                    clutColor = costume.palette[color]
                    try:
                        self.img.putpixel((x, y), (
                            res.data[costume.paletteOff + (3 * clutColor) + 0],
                            res.data[costume.paletteOff + (3 * clutColor) + 1],
                            res.data[costume.paletteOff + (3 * clutColor) + 2],
                            255))
                    except Exception as e:
                        print('Error {:d},{:d} size {:d}{:d}'.format(x, y, self.width, self.height))
                        print(e)
                rep -= 1
                y += 1
                if y >= self.height:
                    y = 0
                    x += 1
                    if x >= self.width:
                        return
    #
    def toDict(self):
        d =  {
            'rel': [self.relX, self.relY],
            'move': [self.moveX, self.moveY]
        }
        try:
            d['texture'] = self.img.toDict()
            d['redirLimb'] = self.redirLimb
            d['redirPict'] = self.redirPict
        except AttributeError:
            pass
        return d

class Limb:
    def __init__(self, res, limbOff, length, costume):
        self.pictures = []
        off = res.off + res.costOffStart + limbOff
        end = off + length
        i = 0
        while off < end:
            pictOff = unpack_from('H', res.data, off)[0]
            off += 2
            if pictOff == 0:
                self.pictures.append(None)
            else:
                try:
                    self.pictures.append(Picture(res, pictOff, costume))
                except Exception as e:
                    print('error in pict {:d} off {:d}'.format(i, pictOff))
                    print(e)
    #
    def toDict(self):
        return dict([(i[0], i[1].toDict()) for i in enumerate(self.pictures) if i[1]])

class Costume:
    def __init__(self, res, paletteOff):
        off = res.off + 8
        self.paletteOff = paletteOff
        (self.numAnims, self.format) = unpack_from('BB', res.data, off)
        self.numAnims += 1
        off += 2
        paletteSize = 16 << (self.format & 1)
        self.palette = res.data[off:(off + paletteSize)]
        off += paletteSize
        self.animCmdsOffsets = unpack_from('H', res.data, off)[0]
        off += 2
        self.limbsOffsets = [0] * 16
        for i in range(15, -1, -1):
            self.limbsOffsets[i] = unpack_from('H', res.data, off)[0]
            off += 2
        self.animOffsets = unpack_from('{:d}H'.format(self.numAnims), res.data, off)
        # compute the global anim mask (ie which limbs are used)
        mask = 0
        for i in range(0, self.numAnims):
            if self.animOffsets[i] != 0:
                mask |= unpack_from('<H', res.data, res.off + res.costOffStart + self.animOffsets[i])[0]
        assert(mask != 0)
        # Read the commands
        # find the first limb (yep it go backward)
        off = res.off + res.costOffStart + self.animCmdsOffsets
        self.anims = []
        for i in range(0, self.numAnims):
            animOff = self.animOffsets[i]
            if animOff:
                self.anims.append(Animation(res, animOff, self.animCmdsOffsets))
            else:
                self.anims.append(None)
        for i in range(0, self.numAnims):
            animOff = self.animOffsets[i]
            if animOff:
                self.anims.append(Animation(res, animOff, self.animCmdsOffsets))
            else:
                self.anims.append(None)
        self.limbs = [None] * 16
        for i in range(15, -1, -1):
            if not mask & (1 << i):
                continue
            length = 0
            j = i  - 1
            startOff = self.limbsOffsets[i]            
            while length == 0 and j >= 0:
                length = self.limbsOffsets[j] - startOff
                j -= 1
            if length == 0:
                continue
            try:
                self.limbs[i] = Limb(res, startOff, length, self)
            except Exception as e:
                print('Error in limb {:d}'.format(i))
                print(e)
        self.texture = packTextures(self.getTextures())
    #
    def toDict(self):
        return {
            'frames': dict([(i[0], i[1].toDict()) for i in enumerate(self.limbs) if i[1]]),
            'animations': dict([(i[0], i[1].toDict()) for i in enumerate(self.anims) if i[1]])
            }
    def getTextures(self):
        textures = []
        for limb in self.limbs:
            if not limb:
                continue
            for pict in limb.pictures:
                try:
                    textures.append(pict.img)
                except:
                    pass
        return textures
    #
    def render(self, img, x, y, animId, frameNum):
        anim = self.anims[animId]
        if not anim:
            return img
        for i in range(15, -1, -1):
            animLimb = anim.limbs[i]
            if not animLimb:
                continue
            limb = self.limbs[i]
            cmd = animLimb.cmds[frameNum]
            if cmd > len(limb.pictures):
                # print('Command {:x}'.format(cmd))
                return
            pict = limb.pictures[cmd]
            if pict:
                img.paste(pict.img, (x + pict.relX, y + pict.relY), pict.img)
    #
    def __repr__(self):
        j = json.dumps(self.toDict(), indent=2, sort_keys=True)
        j = re.sub('\n\s+(-?\d+),','\g<1>,',j)
        j = re.sub('\n\s+(-?\d+)\n\s+]','\g<1>]',j)
        return j
