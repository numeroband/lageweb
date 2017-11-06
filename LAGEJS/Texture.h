//
//  Texture.h
//  LAGEJS
//
//  Created by Lorenzo Soto Doblado on 11/5/17.
//  Copyright © 2017 Lorenzo Soto Doblado. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@protocol TextureExport <JSExport>
@property (nonatomic) NSUInteger width;
@property (nonatomic) NSUInteger height;

- (JSValue*)fromImage:(NSString*)name;

JSExportAs(newSurface,
- (void)newSurface:(NSUInteger)width
            height:(NSUInteger)height);

JSExportAs(setColor,
- (void)setColor:(NSUInteger)x
               y:(NSUInteger)y
               r:(uint8_t)r
               g:(uint8_t)g
               b:(uint8_t)b
               a:(uint8_t)a);

- (void)fromSurface;

JSExportAs(vertices,
- (NSArray<NSNumber*>*)vertices:(NSDictionary<NSString*,NSNumber*>*)camera
                              z:(NSUInteger)z
                            src:(NSDictionary<NSString*,NSNumber*>*)src
                            dst:(NSDictionary<NSString*,NSNumber*>*)dst
                           flip:(BOOL)flip);
@end

@interface Texture : NSObject<TextureExport>
@property (nonatomic) NSUInteger width;
@property (nonatomic) NSUInteger height;

- (instancetype)initWithDevice:(id<MTLDevice>)device;

@end
