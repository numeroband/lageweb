from struct import unpack_from

def extractFile(dottFile, filePath, output=None):
	fd = open(dottFile, 'rb')
	fd.seek(0)
	sizeOfFileRecord = 20
	(magic,
		version,
		startOfIndex,
		startOfFileEntries,
		startOfFileNames,
		startOfData,
		sizeOfIndex,
		sizeOfFileEntries,
		sizeOfFileNames,
		sizeOfData) = unpack_from('10I', fd.read(10 * 4))
	numFiles = sizeOfFileEntries / sizeOfFileRecord
	currNameOffset = startOfFileNames
	for i in range(0, numFiles):
		fd.seek(startOfFileEntries + (i * sizeOfFileRecord))
		(fileDataPos,
			fileNamePos,
			dataSize,
			dataSize2,
			compressed) = unpack_from('5I', fd.read(5 * 4))
		fd.seek(currNameOffset)
		name = ''
		c = fd.read(1)
		currNameOffset += 1
		while (c != '\x00' and len(name) < 100):
			name += c
			c = fd.read(1)
			currNameOffset += 1
		if name != filePath:
			continue
		fd.seek(startOfData + fileDataPos)
		if output:
			with open(output, 'wb') as fdOut:
				fdOut.write(fd.read(dataSize))
			return
		else:
			return bytearray(fd.read(dataSize))

