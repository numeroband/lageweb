//
//  Renderer.h
//  LAGEJS
//
//  Created by Lorenzo Soto Doblado on 11/5/17.
//  Copyright © 2017 Lorenzo Soto Doblado. All rights reserved.
//

#import <MetalKit/MetalKit.h>
#import <JavaScriptCore/JavaScriptCore.h>

@class Texture;
@class Text;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wnullability-completeness"
@protocol JSRenderer <JSExport>
- (Texture*_Nonnull)newTexture;

JSExportAs(render,
- (void)render:(NSDictionary*_Nonnull)camera obj:(JSValue*_Nonnull)obj);
@end
#pragma clang diagnostic pop

// Our platform independent renderer class.   Implements the MTKViewDelegate protocol which
//   allows it to accept per-frame update and drawable resize callbacks.
@interface Renderer : NSObject <MTKViewDelegate, JSRenderer>

-(nonnull instancetype)initWithMetalKitView:(nonnull MTKView *)view;

@end

