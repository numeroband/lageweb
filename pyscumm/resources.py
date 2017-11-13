from images import ImageDecoder, MaskDecoder
from costumes import Costume
from charsets import Charset
from textures import packTextures

from struct import unpack_from
from numpy import uint8
from subprocess import call
import json
import re
import tempfile

class ScummResource:
    descumm = '/Users/lorenzo/lage/scummvm-tools-install/bin/descumm'
    containers = [
        'LECF', 'LFLF', 'ROOM', 'RMIM', 'IMxx', 'OBIM', 'OBCD', 'PALS', 'WRAP', 'SOUN', 'SOU', 'SBL'
    ]
    excludeHeader = [
        'ROL', 'ADL', 'SBL', 'SPK', 'AUhd', 'AUdt'
    ]
    @classmethod
    def decode(klass, data):
        for i in range(0, len(data)):
            data[i] = data[i] ^ 0x69
    #
    @classmethod
    def loadFile(klass, file):
        with open(file, 'rb') as binary_file:
            data = bytearray(binary_file.read())
        klass.decode(data)
        return ScummResource(data)
    #
    def __init__(self, data, off=0, parent=None):
        self.data = data
        self.off = off
        self.parent = parent
        (resType, self.length) = unpack_from('>4sI', data, off)
        self.resType = resType.strip()
        if self.resType in self.excludeHeader:
            self.length += 8
        self.childs = []
        if not re.sub('[0-9]', 'x', self.resType) in self.containers:
            return        
        end = off + self.length
        off += 8
        while (off < end):
            child = ScummResource(data, off, self)
            self.childs.append(child)
            off += child.length
    #
    def items(self, index):
        return filter(lambda child: child.resType == index, self.childs)
    #
    # def __getattr__(self, index):
    #     return self[index]
    #
    def __getitem__(self, index):
        res = self.items(index)
        if len(res) == 0:
            return None
        if len(res) == 1:
            return res[0]
        return res
    #
    def __repr__(self):
        return self.resType
    #
    def __iter__(self):
        yield('type',self.resType)
        yield('offset',self.off)
        yield('length',self.length)
        if (len(self.childs) !=0):
            yield('childs',map(lambda child: dict(child), self.childs))
    def __len__(self):
        return 1
    #
    def hex(self):
        return ":".join("{:02x}".format(c) for c in self.data[self.off:(self.off + self.length)])
    #
    def toFile(self, fileName):
        with open(fileName, 'wb') as f:
            off = self.off + 8
            (resType, length) = unpack_from('>4sI', self.data, off)
            off += 8 + length
            f.write(self.data[off:(self.off+self.length)])
    #
    def findAll(self, resType):
        res = filter(lambda child: child.resType == resType, self.childs)
        if len(res) != 0:
            return res
        for child in self.childs:
            res = child.findAll(resType)
            if len(res) != 0:
                return res
        return []
    #
    def findType(self, resType):
        res = self.findAll(resType)
        if len(res) == 0:
            return None
        return res[0]
    #
    def findParent(self, resType):
        if not self.parent:
            return None
        if self.parent.resType == resType:
            return self.parent
        return self.parent.findParent(resType)
    #
    def parse(self):
        method = None
        try:
            method = getattr(self, 'parse' + re.sub('[0-9]', 'x', self.resType))
        except AttributeError:
            return None
        return method()
    #
    def parseRNAM(self):
        off = self.off + 8
        rooms = []
        while (self.data[off] != 0):
            room = { 'id': self.data[off]}
            off += 1
            room['name'] = ''
            for i in range(0, 9):
                c = uint8(~self.data[off])
                if c != 0:
                    room['name'] += chr(c)
                off += 1
            rooms.append(room)
        return rooms
    #
    def parseOBNA(self):
        off = self.off + 8
        name = ''
        while (self.data[off] != 0):
            name += chr(self.data[off])
            off += 1
        return name
    #
    def parseLOFF(self):
        off = self.off + 8
        numRooms = self.data[off]
        off += 1
        rooms = []
        for i in range(0, numRooms):
            room = {}
            (room['id'], room['offset']) = unpack_from('<BI', self.data, off + (5 * i))
            rooms.append(room)
        return rooms
    def parseRMHD(self):
        off = self.off + 8
        room = {}
        (room['width'], room['height'], room['numObjects']) = unpack_from('<HHH', self.data, off)
        return room
    #
    def parseCYCL(self):
        off = self.off + 8
        cycles = []
        while (self.data[off] != 0):
            c = {}
            (c['idx'], c['unk'], c['freq'], c['flags'], c['start'], c['end']) = unpack_from('>BHHHBB', self.data, off)
            cycles.append(c)
            off += 9
        return cycles
    #
    def parseTRNS(self):
        off = self.off + 8
        return self.data[off]
    #
    def parseBOXD(self):
        off = self.off + 8
        numBoxes = unpack_from('<H', self.data, off)[0] & 0xFF
        off += 2
        boxes = []
        for i in range(0, numBoxes):
            box = {'id': i, 'box': [[0,0], [0,0], [0,0], [0,0]]}
            (
                box['box'][0][0], box['box'][0][1], 
                box['box'][1][0], box['box'][1][1], 
                box['box'][2][0], box['box'][2][1], 
                box['box'][3][0], box['box'][3][1], 
                box['mask'], box['flags'], 
                scale) = unpack_from('<hhhhhhhhBBH', self.data, off)
            if scale & 0x8000:
                box['scaleSlot'] = scale & 0x7FFF
            else:
                box['scale'] = scale
            boxes.append(box)
            off += 20
        return boxes   
    #
    def parseBOXM(self):
        off = self.off + 8
        end = self.off + self.length
        boxes = []
        while off < end:
            box = []
            while self.data[off] != 0xFF:
                path = [ self.data[off], self.data[off + 1], self.data[off + 2] ]
                off += 3
                box.append(path)
            off += 1
            boxes.append(box)
        return boxes
    #
    def parseSCAL(self):
        off = self.off + 8
        slots = []
        for i in range(0, 4):
            slot = {}
            (slot['scale1'], slot['y1'], slot['scale2'], slot['y2']) = unpack_from('<HHHH', self.data, off)
            off += 8
            slots.append(slot)
        return slots
    #
    def parseRMIH(self):
        off = self.off + 8
        return self.data[off]
    #
    def parseCDHD(self):        
        off = self.off + 8
        obj = {}
        (obj['id'], obj['x'], obj['y'], obj['width'], obj['height'], 
            obj['flags'], obj['parent'], obj['walkX'], obj['walkY'], 
            obj['direction']) = unpack_from('<HBBBBBBHHB', self.data, off)
        return obj
    #
    def parseIMHD(self):
        off = self.off + 8
        obj = {}
        (obj['id'], 
            obj['numImages'], 
            obj['numPlanes'], 
            obj['flags'], 
            obj['x'], 
            obj['y'], 
            obj['width'], 
            obj['height']) = unpack_from('HHHBxHHHH', self.data, off)
        off += 16
        if False:
            obj['hotspots'] = []
            obj['numHotspots'] = unpack_from('HHHBxHHHH', self.data, off)[0]
            off += 2
            for i in range(0, obj['numImages']):
                hotspot = {}
                (hotspot['x'], hotspot['y']) = unpack_from('hh', self.data, off)
                obj['hotspots'].append(hotspot)
                off += 4        
        return obj
    #
    def getTrans(self):
        return self.findParent('ROOM')['TRNS'].parse()
    #
    def getPaletteOffset(self):
        room = self.findParent('LFLF')['ROOM']
        clut = room['CLUT']
        if clut:
            # v5 costume offsets are based on +2
            self.costOffStart = 2            
            return clut.off + 8
        else:
            # v6 costume offsets are based on +8
            self.costOffStart = 8            
            return room['PALS']['WRAP']['APAL'].off + 8
    #
    def getImageHeader(self):
        if self.parent.parent.resType == 'OBIM':
            return self.parent.parent['IMHD'].parse()
        else:
            return self.findParent('ROOM')['RMHD'].parse()
    #
    def parseSMAP(self):
        header = self.getImageHeader()
        paletteOffset = self.getPaletteOffset()
        trans = self.getTrans()
        decoder = ImageDecoder(self, header['width'], header['height'], paletteOffset, trans)
        return decoder.img
    #   
    def parseZPxx(self):
        header = self.getImageHeader()
        decoder = MaskDecoder(self, header['width'], header['height'])
        if decoder.emptyMask:
            return None
        return decoder.img
    #
    def parseCOST(self):
        paletteOffset = self.getPaletteOffset()
        return Costume(self, paletteOffset)
    #
    def parseCHAR(self):
        paletteOffset = self.getPaletteOffset()
        return Charset(self, paletteOffset)
    #
    def parseROOM(self):
        return Room(self)
    #
    def parseENCD(self):
        return self.printScript()
    #
    def parseEXCD(self):
        return self.printScript()
    #
    def parseLSCR(self):
        return self.printScript()
    #
    def parseSCRP(self):
        return self.printScript()
    #
    def parseVERB(self):
        return self.printScript()
    #
    def parseAUdt(self):
        return 'Creative Voice File\x1a\x1a\x00\x0a\x01\x29\x11' + self.data[self.off+8:self.off+self.length]
    #
    def printScript(self):
        fd = tempfile.NamedTemporaryFile(delete=True)
        fd.write(self.data[self.off:(self.off + self.length)])
        fd.flush()
        args = [self.descumm]
        args.append('-5')
        args.append(fd.name)
        return call(args)

class Room(dict):
    def __init__(self, roomRes):
        textures = []
        objsById = {}
        rmhd = roomRes['RMHD'].parse()
        rmim = roomRes['RMIM']
        numPlanes = rmim['RMIH'].parse()
        self['background'] = {
            'images': [self.getLayers(rmim['IM00'], numPlanes, textures)],
            'rect': [0, 0, rmhd['width'], rmhd['height']]
        }
        for obim in roomRes.items('OBIM'):
            imhd = obim['IMHD'].parse()
            objId = imhd['id']
            obj = {'id': objId}
            objsById[objId] = obj
            numPlanes = imhd['numPlanes']
            numImages = imhd['numImages']
            images = [None] * numImages
            for imId in range(1, imhd['numImages'] + 1):
                im = obim['IM{:02X}'.format(imId)]
                if not im:
                    continue
                images[imId - 1] = self.getLayers(im, numPlanes, textures)
            obj['images'] = images
        objs = {}
        for obcd in roomRes.items('OBCD'):
            origName = obcd['OBNA'].parse()
            name = self.camelCase(origName)
            i = 1
            while name in objs:
                i += 1
                name = '{:s}{:d}'.format(self.camelCase(origName), i)
            cdhd = obcd['CDHD'].parse()
            obj = objsById[cdhd['id']]
            obj['rect'] = [cdhd['x'] * 8, cdhd['y'] * 8, cdhd['width'] * 8, cdhd['height'] * 8]
            obj['walk'] = [cdhd['walkX'], cdhd['walkY']]
            obj['flags'] = cdhd['flags']
            obj['parent'] = cdhd['parent']
            obj['direction'] = cdhd['direction']
            obj['name'] = origName
            objs[name] = obj
        self['objects'] = objs
        self['boxes'] = roomRes['BOXD'].parse()
        self['matrix'] = roomRes['BOXM'].parse()
        self['scaleSlots'] = roomRes['SCAL'].parse()
        self.texture = packTextures(textures)
    #
    @staticmethod
    def camelCase(st):
        output = ''.join(x for x in st.title() if x.isalpha())
        if output == '':
            return '_'
        return output[0].lower() + output[1:]
    #
    @staticmethod
    def getLayers(st, planes, textures):
        smapRes = st['SMAP']
        if not smapRes:
            return None
        layers = {}
        smap = st['SMAP'].parse()
        layers[0] = smap
        textures.append(smap)
        for i in range(1, planes + 1):
            layer = st['ZP{:02X}'.format(i)]
            if not layer:
                continue
            mask = layer.parse()
            if not mask:
                continue
            img = smap.applyMask(mask)
            layers[i] = img
            textures.append(img)
        return layers
    #
    def __repr__(self):
        j = json.dumps(self, cls=ScummJSONEncoder, indent=2, sort_keys=True)
        j = re.sub('\n\s+(-?\d+),','\g<1>,',j)
        j = re.sub('\n\s+(-?\d+)\n\s+]','\g<1>]',j)
        return j

class ScummJSONEncoder(json.JSONEncoder):
    def default(self, o):
        return o.toDict()
