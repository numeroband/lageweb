class BitParser:
    def __init__(self, data, off, length):
        self.data = data
        self.length = length
        self.off = off
        self.bits = 0
        self.bitsLength = 0
        self.addByte()
    #
    def len(self):
        return self.length * 8 + self.bitsLength
    #
    def read(self, numBits):
        assert(numBits <= 8)
        assert(numBits <= self.len())
        value = self.bits & ((1 << numBits) - 1)
        self.bits >>= numBits
        self.bitsLength -= numBits
        if (self.bitsLength < 8):
        	self.addByte()
        return value
    #
    def addByte(self):
    	nextByte = self.data[self.off] << self.bitsLength
    	self.bits |= nextByte
    	self.length -= 1
    	self.off += 1
    	self.bitsLength += 8
