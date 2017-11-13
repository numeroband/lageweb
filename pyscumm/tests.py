from struct import unpack_from
from numpy import zeros, unpackbits, uint8, full, set_printoptions
from matplotlib.pyplot import plot, ion, show, matshow, imshow, cm, figure
from scipy import misc
from PIL import Image
import json
import re

import pyscumm.bitparser as bp
reload(bp)
import pyscumm.textures as scummtex
reload(scummtex)
import pyscumm.costumes as scummcost
reload(scummcost)
import pyscumm.charsets as scummchar
reload(scummchar)
import pyscumm.images as scummimg
reload(scummimg)
import pyscumm.dott as dott
reload(dott)
import pyscumm.resources as scummres
reload(scummres)
ScummResource = scummres.ScummResource
Texture = scummtex.Texture

DESCUMM = '/Users/lorenzo/lage/scummvm-tools-install/bin/descumm'

sc = ScummResource.loadFile('/Users/lorenzo/lage/atlantis/ATLANTIS.001')
# sc = ScummResource(sc.data)
# cost = sc['LFLF'][9]['COST'][0].parse()

def saveRoom(prefix, path, start, end):
    for i in range(start, end):
        lflf = sc['LFLF'][i]
        print('- room {:d}'.format(i))
        room = lflf['ROOM'].parse()
        with open('{:s}/jsons/{:s}{:02d}.json'.format(path, prefix, i), 'w') as fd:
            fd.write(str(room))
        room.texture.save('{:s}/images/{:s}{:02d}.png'.format(path, prefix, i))
        costId = 0
        for costRes in lflf.items('COST'):
            print('--- cost {:d}'.format(costId))
            cost = costRes.parse()
            with open('{:s}/jsons/{:s}{:02d}_Cost{:02d}.json'.format(path, prefix, i, costId), 'w') as fd:
                fd.write(str(cost))
            cost.texture.save('{:s}/images/{:s}{:02d}_Cost{:02d}.png'.format(path, prefix, i, costId))
            costId += 1
        charId = 0
        for charRes in lflf.items('CHAR'):
            print('--- charset {:d}'.format(charId))
            char = charRes.parse()
            with open('{:s}/fonts/{:s}{:02d}_Charset{:02d}.json'.format(path, prefix, i, charId), 'w') as fd:
                fd.write(str(char))
            charId += 1

# saveRoom('Atlantis_', '/Users/lorenzo/lage/lage/Data/Assets', 9, 10)

# sc = ScummResource.loadFile('/Users/lorenzo/lage/monkey2/monkey2.001')
# saveRoom('Monkey2_', '/Users/lorenzo/lage/lage/Data/Assets', 0, 10)

# for i in range(len(sc['LFLF'][9]['SOUN'])):
#     for s in sc['LFLF'][9]['SOUN'][i]['SOU'].childs:
#         s.toFile('/tmp/indy{:s}{:d}.mid'.format(s.resType, i))

voc = sc['LFLF'][9]['SOUN'][4]['SOU']['SBL']['AUdt'].parse()

with open('/tmp/output.voc', 'wb') as fd:
    fd.write(voc) 

