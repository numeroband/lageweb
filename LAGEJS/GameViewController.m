//
//  GameViewController.m
//  LAGEJS
//
//  Created by Lorenzo Soto Doblado on 11/5/17.
//  Copyright © 2017 Lorenzo Soto Doblado. All rights reserved.
//

#import "GameViewController.h"
#import "Renderer.h"

@implementation GameViewController
{
    MTKView *_view;

    Renderer *_renderer;
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    _view = (MTKView *)self.view;

    _view.device = MTLCreateSystemDefaultDevice();

    if(!_view.device)
    {
        NSLog(@"Metal is not supported on this device");
        self.view = [[NSView alloc] initWithFrame:self.view.frame];
        return;
    }

    _renderer = [[Renderer alloc] initWithMetalKitView:_view];

    [_renderer mtkView:_view drawableSizeWillChange:_view.bounds.size];

    _view.delegate = _renderer;
    
    NSTrackingArea *trackingArea = [[NSTrackingArea alloc] initWithRect:_view.visibleRect
                                                                options: (NSTrackingMouseEnteredAndExited | NSTrackingMouseMoved | NSTrackingActiveInKeyWindow )
                                                                  owner:self userInfo:nil];
    [_view addTrackingArea:trackingArea];
}

- (BOOL)acceptsFirstResponder
{
    return YES;
}

- (void)mouseDown:(NSEvent *)event
{
    [_renderer mouseMoved:event
                leftClick:YES
               rightClick:NO];
}

- (void)rightMouseDown:(NSEvent *)event
{
    [_renderer mouseMoved:event
                leftClick:NO
               rightClick:YES];
}

- (void)mouseMoved:(NSEvent *)event
{
    [_renderer mouseMoved:event
                leftClick:NO
               rightClick:NO];
}

- (void)mouseEntered:(NSEvent *)event
{
    [NSCursor hide];
}
- (void)mouseExited:(NSEvent *)event
{
    [NSCursor unhide];
}


@end
