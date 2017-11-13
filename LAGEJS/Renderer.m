//
//  Renderer.m
//  LAGEJS
//
//  Created by Lorenzo Soto Doblado on 11/5/17.
//  Copyright © 2017 Lorenzo Soto Doblado. All rights reserved.
//

#import <simd/simd.h>
#import <ModelIO/ModelIO.h>

#import "Renderer.h"
#import "Texture.h"
#import "Resources.h"

// Include header shared between C code here, which executes Metal API commands, and .metal files
#import "ShaderTypes.h"

static const NSUInteger kMaxBuffersInFlight = 3;

@implementation Renderer
{
    dispatch_semaphore_t _inFlightSemaphore;
    id <MTLDevice> _device;
    id <MTLCommandQueue> _commandQueue;

    id <MTLRenderPipelineState> _pipelineState;
    id <MTLRenderPipelineState> _debugPipelineState;
    id <MTLDepthStencilState> _depthState;
    id <MTLRenderCommandEncoder> _renderEncoder;
    
    JSValue *_engine;
    NSPoint _resolution;
    BOOL _debugEnabled;
}

-(nonnull instancetype)initWithMetalKitView:(nonnull MTKView *)view;
{
    self = [super init];
    if(self)
    {
        _resolution.x = 320;
        _resolution.y = 200;
        _device = view.device;
        _inFlightSemaphore = dispatch_semaphore_create(kMaxBuffersInFlight);
        [self _loadMetalWithView:view];
        [self _loadJS];
    }

    return self;
}

- (void)_loadJS;
{
    // getting a JSContext
    JSContext *context = [JSContext new];
    [context setExceptionHandler:^(JSContext *context, JSValue *value) {
        NSLog(@"%@", value);
    }];
    
    // Adding console support
    context[@"console"][@"log"] = ^(NSString *msg) {
        printf("%s\n", msg.UTF8String);
    };
    
    NSError *error;
    NSURL *mainJsUrl = [[NSBundle mainBundle] URLForResource:@"main"
                                            withExtension:@"js"
                                             subdirectory:@"scripts"];
    NSString *mainJsText = [NSString stringWithContentsOfURL:mainJsUrl
                                                        encoding:NSUTF8StringEncoding
                                                           error:&error];
    [context evaluateScript:mainJsText withSourceURL:mainJsUrl];
    
    // calling a JavaScript function
    JSValue *engineModule = [context[@"require"] callWithArguments:@[@"santa/santa"]];
    Resources *resources = [[Resources alloc] init];
    NSDictionary *resolution = @{@"x": @(_resolution.x), @"y": @(_resolution.y)};
    _engine = [engineModule[@"Santa"] constructWithArguments:@[self,
                                                                resources,
                                                                resolution]];
    [_engine invokeMethod:@"init" withArguments:nil];
}

- (void)_loadMetalWithView:(nonnull MTKView *)view;
{
    /// Load Metal state objects and initalize renderer dependent view properties

    view.depthStencilPixelFormat = MTLPixelFormatDepth32Float_Stencil8;
    view.colorPixelFormat = MTLPixelFormatBGRA8Unorm_sRGB;
    view.clearDepth = 0.0;
    view.sampleCount = 1;

    id<MTLLibrary> defaultLibrary = [_device newDefaultLibrary];

    id <MTLFunction> vertexFunction = [defaultLibrary newFunctionWithName:@"vertexShader"];

    id <MTLFunction> fragmentFunction = [defaultLibrary newFunctionWithName:@"fragmentShader"];

    MTLRenderPipelineDescriptor *pipelineStateDescriptor = [[MTLRenderPipelineDescriptor alloc] init];
    pipelineStateDescriptor.label = @"MyPipeline";
    pipelineStateDescriptor.sampleCount = view.sampleCount;
    pipelineStateDescriptor.vertexFunction = vertexFunction;
    pipelineStateDescriptor.fragmentFunction = fragmentFunction;
    pipelineStateDescriptor.colorAttachments[0].pixelFormat = view.colorPixelFormat;
    pipelineStateDescriptor.depthAttachmentPixelFormat = view.depthStencilPixelFormat;
    pipelineStateDescriptor.stencilAttachmentPixelFormat = view.depthStencilPixelFormat;

    NSError *error = NULL;
    _pipelineState = [_device newRenderPipelineStateWithDescriptor:pipelineStateDescriptor error:&error];
    if (!_pipelineState)
    {
        NSLog(@"Failed to created pipeline state, error %@", error);
    }
    
    MTLRenderPipelineDescriptor *debugPipelineStateDescriptor = [[MTLRenderPipelineDescriptor alloc] init];
    debugPipelineStateDescriptor.label = @"DebugPipeline";
    debugPipelineStateDescriptor.sampleCount = view.sampleCount;
    debugPipelineStateDescriptor.vertexFunction = [defaultLibrary newFunctionWithName:@"vertexShader"];
    debugPipelineStateDescriptor.fragmentFunction =  [defaultLibrary newFunctionWithName:@"fragmentShader"];
    debugPipelineStateDescriptor.colorAttachments[0].pixelFormat = view.colorPixelFormat;
    debugPipelineStateDescriptor.depthAttachmentPixelFormat = view.depthStencilPixelFormat;
    debugPipelineStateDescriptor.stencilAttachmentPixelFormat = view.depthStencilPixelFormat;
    
    _debugPipelineState = [_device newRenderPipelineStateWithDescriptor:debugPipelineStateDescriptor error:&error];
    if (!_debugPipelineState)
    {
        NSLog(@"Failed to create debug pipeline state, error %@", error);
    }

    MTLDepthStencilDescriptor *depthStateDesc = [[MTLDepthStencilDescriptor alloc] init];
    depthStateDesc.depthCompareFunction = MTLCompareFunctionGreater;
    depthStateDesc.depthWriteEnabled = YES;
    _depthState = [_device newDepthStencilStateWithDescriptor:depthStateDesc];
    
    _commandQueue = [_device newCommandQueue];
}

- (void)drawInMTKView:(nonnull MTKView *)view
{
    /// Per frame updates here

    dispatch_semaphore_wait(_inFlightSemaphore, DISPATCH_TIME_FOREVER);

    id <MTLCommandBuffer> commandBuffer = [_commandQueue commandBuffer];
    commandBuffer.label = @"MyCommand";

    __block dispatch_semaphore_t block_sema = _inFlightSemaphore;
    [commandBuffer addCompletedHandler:^(id<MTLCommandBuffer> buffer)
     {
         dispatch_semaphore_signal(block_sema);
     }];

    [_engine invokeMethod:@"update" withArguments:nil];

    /// Delay getting the currentRenderPassDescriptor until we absolutely need it to avoid
    ///   holding onto the drawable and blocking the display pipeline any longer than necessary
    MTLRenderPassDescriptor* renderPassDescriptor = view.currentRenderPassDescriptor;

    if(renderPassDescriptor != nil) {
        _renderEncoder = [commandBuffer renderCommandEncoderWithDescriptor:renderPassDescriptor];
        _renderEncoder.label = @"MyRenderEncoder";

        [_renderEncoder pushDebugGroup:@"DrawScene"];

        [_renderEncoder setDepthStencilState:_depthState];
        
        [_renderEncoder setRenderPipelineState:_pipelineState];
        [_engine invokeMethod:@"render" withArguments:nil];
        
        if (_debugEnabled)
        {
            [_renderEncoder setRenderPipelineState:_debugPipelineState];
            [_engine invokeMethod:@"debugRender" withArguments:nil];
        }

        [_renderEncoder popDebugGroup];

        [_renderEncoder endEncoding];
        
        [commandBuffer presentDrawable:view.currentDrawable];
        _renderEncoder = nil;
    }

    [commandBuffer commit];
}

- (void)mtkView:(nonnull MTKView *)view drawableSizeWillChange:(CGSize)size
{
    /// Respond to drawable size or orientation changes here

//    float aspect = size.width / (float)size.height;
}

- (Texture*_Nonnull)newTexture
{
    return [[Texture alloc] initWithDevice:_device];
}

- (void)render:(nonnull Texture*)tex
      vertices:(nonnull NSArray<NSNumber*>*)vertices
        camera:(nullable NSDictionary<NSString*,NSNumber*>*)camera
{
    if (!camera) {
        camera = _defaultCamera;
    }
    
    Uniforms uniforms;
    uniforms.camera.x = camera[@"x"].floatValue;
    uniforms.camera.y = camera[@"y"].floatValue;
    uniforms.camera.width = camera[@"w"].floatValue;
    uniforms.camera.height = camera[@"h"].floatValue;
    uniforms.textSize[0] = (float)tex.width;
    uniforms.textSize[1] = (float)tex.height;

    Quad verticesData[vertices.count / 5];
    for (int i = 0; i < vertices.count / 5; ++i)
    {
        verticesData[i].position[0] = vertices[5 * i + 0].floatValue;
        verticesData[i].position[1] = vertices[5 * i + 1].floatValue;
        verticesData[i].position[2] = vertices[5 * i + 2].floatValue;
        verticesData[i].texCoord[0] = vertices[5 * i + 3].floatValue;
        verticesData[i].texCoord[1] = vertices[5 * i + 4].floatValue;
    }

    [_renderEncoder setVertexBytes:verticesData
                            length:sizeof(Quad) * vertices.count / 5
                           atIndex:BufferIndexMeshPositions];

    [_renderEncoder setVertexBytes:&uniforms
                            length:sizeof(uniforms)
                           atIndex:BufferIndexUniforms];
    
    [_renderEncoder setFragmentTexture:tex.texture
                               atIndex:TextureIndexColor];
    
    [_renderEncoder drawPrimitives:MTLPrimitiveTypeTriangle
                       vertexStart:0
                       vertexCount:vertices.count / 5];
}

- (void)mouseMoved:(NSEvent*)event
         leftClick:(BOOL)leftClick
        rightClick:(BOOL)rightClick
{
    const NSUInteger width = event.window.contentLayoutRect.size.width;
    const NSUInteger height = event.window.contentLayoutRect.size.height;
    const NSUInteger x = event.locationInWindow.x * _resolution.x / width;
    const NSUInteger y = _resolution.y - (event.locationInWindow.y * _resolution.y / height);
    
    [_engine invokeMethod:@"mouseMove"
            withArguments:@[@{@"x": @(x), @"y": @(y)}, @(leftClick || rightClick)]];
}

@end
