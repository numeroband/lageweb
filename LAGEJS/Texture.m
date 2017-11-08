//
//  Texture.m
//  LAGEJS
//
//  Created by Lorenzo Soto Doblado on 11/5/17.
//  Copyright © 2017 Lorenzo Soto Doblado. All rights reserved.
//

#import "Texture.h"
#import <MetalKit/MetalKit.h>

@interface Texture()
@property (nonatomic) id<MTLDevice> device;
@property (nonatomic) NSMutableData *surface;
@end

@implementation Texture

static const size_t kComponentsPerPixel = 4;
static const size_t kBitsPerComponent = sizeof(uint8_t) * 8;

- (instancetype)initWithDevice:(id<MTLDevice>)device
{
    self = [super init];
    if (!self)
    {
        return nil;
    }
    
    _device = device;
    
    return self;
}

- (JSValue*)fromImage:(NSString*)name
{
    MTKTextureLoader* textureLoader = [[MTKTextureLoader alloc] initWithDevice:_device];
    
    NSDictionary *textureLoaderOptions =
    @{
      MTKTextureLoaderOptionTextureUsage       : @(MTLTextureUsageShaderRead),
      MTKTextureLoaderOptionTextureStorageMode : @(MTLStorageModePrivate)
      };

    NSURL *url = [[NSBundle mainBundle] URLForResource:name
                                         withExtension:@"png"
                                          subdirectory:@"images"];

    NSError *error;
    _texture = [textureLoader newTextureWithContentsOfURL:url
                                                  options:textureLoaderOptions
                                                    error:&error];
    _width = _texture.width;
    _height = _texture.height;
    
    return [[JSContext currentContext][@"Promise"] invokeMethod:@"resolve"
                                                  withArguments:nil];
}

- (void)newSurface:(NSUInteger)width
            height:(NSUInteger)height
{
    _surface = [NSMutableData dataWithLength:width * height * kComponentsPerPixel];
    _width = width;
    _height = height;
}

- (void)setColor:(NSUInteger)x
               y:(NSUInteger)y
               r:(uint8_t)r
               g:(uint8_t)g
               b:(uint8_t)b
               a:(uint8_t)a
{
    uint8_t *buffer = (uint8_t*)_surface.mutableBytes;
    const NSUInteger start = kComponentsPerPixel * (_width * y + x);
    buffer[start + 0] = r;
    buffer[start + 1] = g;
    buffer[start + 2] = b;
    buffer[start + 3] = a;
}

- (void)fromSurface
{
    MTKTextureLoader* textureLoader = [[MTKTextureLoader alloc] initWithDevice:_device];
    
    NSDictionary *textureLoaderOptions =
    @{
      MTKTextureLoaderOptionTextureUsage       : @(MTLTextureUsageShaderRead),
      MTKTextureLoaderOptionTextureStorageMode : @(MTLStorageModePrivate)
      };
 
    
    CGColorSpaceRef rgb = CGColorSpaceCreateDeviceRGB();
    
    CGDataProviderRef provider =
    CGDataProviderCreateWithData(NULL, _surface.bytes, _surface.length, NULL);
    
    CGImageRef imageRef =
    CGImageCreate(_width, _height, kBitsPerComponent,
                  kBitsPerComponent * kComponentsPerPixel,
                  kComponentsPerPixel * _width,
                  rgb,
                  kCGBitmapByteOrderDefault | kCGImageAlphaLast,
                  provider, NULL, false, kCGRenderingIntentDefault);
    
    NSError *error;
    _texture = [textureLoader newTextureWithCGImage:imageRef
                                            options:textureLoaderOptions
                                              error:&error];

    CGImageRelease(imageRef);
    CGDataProviderRelease(provider);
    CGColorSpaceRelease(rgb);
    _surface = nil;
}

- (NSArray<NSNumber*>*)vertices:(NSDictionary<NSString*,NSNumber*>*)camera
                              z:(NSUInteger)z
                            src:(NSDictionary<NSString*,NSNumber*>*)src
                            dst:(NSDictionary<NSString*,NSNumber*>*)dst
                           flip:(BOOL)flip
{
    NSNumber* minx = dst[@"x"];
    NSNumber* maxx = @(dst[@"x"].intValue + dst[@"w"].intValue);
    NSNumber* miny = dst[@"y"];
    NSNumber* maxy = @(dst[@"y"].intValue + dst[@"h"].intValue);
    
    NSNumber* minu = (flip ?
                      @(src[@"x"].intValue + src[@"w"].intValue) :
                      src[@"x"]);
    NSNumber* maxu = (flip ?
                      src[@"x"] :
                      @(src[@"x"].intValue + src[@"w"].intValue));
    NSNumber* minv = src[@"y"];
    NSNumber* maxv = @(src[@"y"].intValue + src[@"h"].intValue);
    
    return @[
            minx, miny, @(z), minu, minv,
            maxx, miny, @(z), maxu, minv,
            minx, maxy, @(z), minu, maxv,
            
            maxx, miny, @(z), maxu, minv,
            minx, maxy, @(z), minu, maxv,
            maxx, maxy, @(z), maxu, maxv
            ];
}

@end
