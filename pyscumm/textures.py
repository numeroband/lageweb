from PIL import Image
import sys
import copy
import json
from math import log, ceil

class Texture:
    def __init__(self, width, height, mask=False):
        if mask:
            mode = '1'
            default = 0
        else:
            mode = 'RGBA'
            default = (0, 0, 0, 0)
        self.img = Image.new(mode, (width, height), default)            
        self.width = width
        self.height = height
        self.x = 0
        self.y = 0
    #
    def putpixel(self, pos, color):
    	self.img.putpixel(pos, color)
    #
    def toDict(self):
        return [self.x, self.y, self.width, self.height]
    #
    def applyMask(self, mask, x=0, y=0):
        masked = Texture(self.width, self.height)
        masked.img.paste(self.img, (0,0), mask.img)
        return masked

def sort_images_by_size(images):
    #sort by area (secondary key)
    sorted_images = sorted(images, \
            key=lambda img: img.width * img.height)
    #sort by max dimension (primary key)
    sorted_images = sorted(sorted_images, \
            key=lambda img: max(img.width, img.height))
    return sorted_images

#----------------------------------------------------------------------

class rectangle:
    def __init__(self, x=0, y=0, wd=0, hgt=0):
        self.x = x
        self.y = y
        self.wd = wd
        self.hgt = hgt
    def split_vert(self,y):
        top = rectangle(self.x, self.y, self.wd, y)
        bottom = rectangle(self.x, self.y+y, self.wd, self.hgt-y)
        return (top, bottom)
    def split_horz(self,x):
        left = rectangle(self.x, self.y, x, self.hgt)
        right = rectangle(self.x+x, self.y, self.wd-x, self.hgt)
        return (left,right)
    def area(self):
        return self.wd * self.hgt
    def max_side(self):
        return max(self.wd, self.hgt)
    def can_contain(self, wd, hgt):
        return self.wd >= wd and self.hgt >=hgt
    def is_congruent_with(self, wd, hgt):
        return self.wd == wd and self.hgt ==hgt
    def to_string(self):
        return "<(%d, %d) - (%d, %d)>" % (self.x, self.y, self.wd, self.hgt)
    def should_split_vertically(self, wd, hgt):
        if (self.wd == wd):
            return True
        elif (self.hgt == hgt):
            return False
        #TODO: come up with a better heuristic
        vert_rects = self.split_vert(hgt)
        horz_rects = self.split_horz(wd)
        return vert_rects[1].area() > horz_rects[1].area()
    def should_grow_vertically(self, wd, hgt):
        can_grow_vert = self.wd >= wd
        can_grow_horz = self.hgt >= hgt
        if (not can_grow_vert and not can_grow_horz):
            raise Exception("Unable to grow!")
        if (can_grow_vert and not can_grow_horz):
            return True
        if (can_grow_horz and not can_grow_vert):
            return False
        return (self.hgt + hgt < self.wd + wd)


#----------------------------------------------------------------------
class rect_node:
    def __init__(self, img, rect=(), children=()):
        self.rect = rect
        if (img):
            self.img = img
        else:
            self.img = ()
        self.children = children
    
    def clone(self):
        if (self.is_leaf()):
            return rect_node(self.img, copy.copy(self.rect))
        else:
            return rect_node(self.img, copy.copy(self.rect),\
                            (self.children[0].clone(), self.children[1].clone()))
    
    def is_leaf(self):
        return not self.children
    
    def is_empty_leaf(self):
        return (self.is_leaf() and not self.img)
    
    def split_node(self, img):
        if (not self.is_leaf):
            raise Exception("Attempted to split non-leaf")
        
        (img_wd, img_hgt) = (img.width, img.height)
        if (not self.rect.can_contain(img_wd, img_hgt)):
            raise Exception("Attempted to place an img in a node it doesn't fit")
        
        #if it fits exactly then we are done...
        if (self.rect.is_congruent_with(img_wd, img_hgt)):
            self.img = img
        else:
            if (self.rect.should_split_vertically(img_wd, img_hgt)):
                vert_rects = self.rect.split_vert(img_hgt)
                top_child = rect_node((), vert_rects[0])
                bottom_child = rect_node((), vert_rects[1])
                self.children = (top_child, bottom_child)
            else:
                horz_rects = self.rect.split_horz(img_wd)
                left_child = rect_node((), horz_rects[0])
                right_child = rect_node((), horz_rects[1])
                self.children = (left_child, right_child)
            self.children[0].split_node(img)
    
    def grow_node(self, img):
        if (self.is_empty_leaf()):
            raise Exception("Attempted to grow an empty leaf")
        (img_wd, img_hgt) = (img.width, img.height)
        new_child = self.clone()
        self.img=()
        self.img_name=()
        if self.rect.should_grow_vertically(img_wd,img_hgt):
            self.children = (new_child,\
                rect_node((), rectangle(self.rect.x, self.rect.y+self.rect.hgt, self.rect.wd, img_hgt)))
            self.rect.hgt += img_hgt
        else:
            self.children= (new_child,\
                rect_node((), rectangle(self.rect.x+self.rect.wd, self.rect.y, img_wd, self.rect.hgt)))
            self.rect.wd += img_wd
        self.children[1].split_node(img)
    
    def to_string(self):
        if (self.is_leaf()):
            return "[ %s ]" % (self.rect.to_string())
        else:
            return "[ %s | %s %s]" % \
                    (self.rect.to_string(), self.children[0].to_string(), self.children[1].to_string())
    def render(self, img):
        if (self.is_leaf()):
            if (self.img):
                img.paste(self.img.img, (self.rect.x, self.rect.y))
        else:
            self.children[0].render(img)
            self.children[1].render(img)

#----------------------------------------------------------------------

def find_empty_leaf(node, img):
    if (node.is_empty_leaf()):
        return node if node.rect.can_contain(img.width, img.height) else ()
    else:
        if (node.is_leaf()):
            return ()
        leaf = find_empty_leaf(node.children[0], img)
        if (leaf):
            return leaf
        else:
            return find_empty_leaf(node.children[1], img)

def pack_images( named_images ):
    root=()
    while named_images:
        named_image = named_images.pop()
        if not root:
            root = rect_node((), rectangle(0, 0, named_image.img.width, named_image.img.height))
            root.split_node(named_image)
            continue
        leaf = find_empty_leaf(root, named_image.img)
        if (leaf):
            leaf.split_node(named_image)
        else:
            root.grow_node(named_image)
    return root

def nearest_power_of_two(n):
    #there's probably some cleverer way to do this... but take the log base-2,
    #and raise 2 to the power of the next integer...
    log_2 = log(n) / log(2)
    return int(2**(ceil(log_2)))

def update_nodes(node):
    if (node.is_leaf()):
        if (node.img):
            node.img.x = node.rect.x
            node.img.y = node.rect.y
        return

    update_nodes(node.children[0])
    update_nodes(node.children[1])

def generate_png(packing):
    padded_dim = nearest_power_of_two(max(packing.rect.wd, packing.rect.hgt))
    sprite_sheet = Image.new('RGBA', (padded_dim, padded_dim))
    packing.render(sprite_sheet)
    return sprite_sheet

def packTextures(textures):
    sorted_images = sort_images_by_size(textures)
    packing = pack_images(sorted_images)
    update_nodes(packing)
    return generate_png(packing)
