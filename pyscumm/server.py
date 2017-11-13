from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
from resources import ScummResource
from io import BytesIO, StringIO
from sys import argv
import os

resources = {}

class ImageAndJson(object):
    def __init__(self, node):
        assert(node)
        self.parsed = node.parse()
        assert(self.parsed)

    def image(self):
        bio = BytesIO()
        self.parsed.texture.save(bio, format='PNG')
        bio.flush()
        bio.seek(0)
        return bio

    def json(self):        
        return StringIO(unicode(self.parsed))
    
class Objects(ImageAndJson):
    def __init__(self, lflf):
        super(Objects, self).__init__(lflf['ROOM'])

class Costume(ImageAndJson):
    def __init__(self, lflf, costId):
        super(Costume, self).__init__(lflf['COST'][costId])

class Charset(ImageAndJson):
    def __init__(self, lflf, charsetId):
        super(Charset, self).__init__(lflf['CHAR'][charsetId])

class Room:
    def __init__(self, res, roomId):
        self.lflf = res['LFLF'][roomId]
        assert(self.lflf)
        self.objs = None
        self.costumes = {}
        self.charsets = {}

    def objects(self):
        if not self.objs:
            self.objs = Objects(self.lflf)
        return self.objs

    def costume(self, costId):
        if costId in self.costumes:
            return self.costumes[costId]
        cost = Costume(self.lflf, costId)
        self.costumes[costId] = cost
        return cost

    def charset(self, charsetId):
        if charsetId in self.charsets:
            return self.charsets[charsetId]
        charset = Charset(self.lflf, charsetId)
        self.charsets[charsetId] = charset
        return charset

class Rooms:
    def __init__(self, path):
        self.res = ScummResource.loadFile(path)
        self.rooms = {}
    
    def room(self, roomId):
        if roomId in self.rooms:
            return self.rooms[roomId]
        room = Room(self.res, roomId)
        assert(room)
        self.rooms[roomId] = room
        return room 

    def objects(self, roomId, ignored):
        room = self.room(roomId)
        return room.objects()
    
    def costume(self, roomId, costId):
        return self.room(roomId).costume(costId)

    def charset(self, roomId, charsetId):
        return self.room(roomId).charset(charsetId)

class ScummHTTPRequestHandler(BaseHTTPRequestHandler):
    funcsIAJ = {
        'Objs': Rooms.objects,
        'Cost': Rooms.costume,
        'Charset': Rooms.charset
    }

    funcsIO = {
        'png': {
            'content-type': 'image/png', 
            'func': ImageAndJson.image
        },
        'json': {
            'content-type': 'application/json', 
            'func': ImageAndJson.json
        }
    }

    def do_GET(self):
        try:
            ext = self.path.split('.')[-1]
            args = self.path.split('/')[-1].split('.')[0].split('_')
            rooms = resources[args[0]]
            roomId = int(args[1])
            sec = 'Objs'
            secId = None
            if len(args) > 3:
                sec = args[2]
                secId = int(args[3])

            imageAndJson = ScummHTTPRequestHandler.funcsIAJ[sec](rooms, roomId, secId)
            fd = ScummHTTPRequestHandler.funcsIO[ext]['func'](imageAndJson)

            self.send_response(200)
            self.send_header('Content-type', ScummHTTPRequestHandler.funcsIO[ext]['content-type'])
            self.end_headers()
            self.wfile.write(fd.read())
            fd.close()

        except:
            self.send_error(404, 'file not found')
    
def run(args):
    print('http server is starting...')

    for i in range(0,len(args), 2):
        name = args[i]
        path = args[i + 1]
        print('adding {:s} from {:s}'.format(name, path))
        resources[name] = Rooms(path)

    server_address = ('localhost', 3000)
    httpd = HTTPServer(server_address, ScummHTTPRequestHandler)
    print('http server is running...')
    httpd.serve_forever()
  
if __name__ == '__main__':
  run(argv[1:])
