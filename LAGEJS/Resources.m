//
//  Resources.m
//  LAGEJS
//
//  Created by Lorenzo Soto Doblado on 11/5/17.
//  Copyright © 2017 Lorenzo Soto Doblado. All rights reserved.
//

#import "Resources.h"

@implementation Resources

- (JSValue*)loadJson:(NSString*)name
{
    NSURL *url = [[NSBundle mainBundle] URLForResource:name
                                         withExtension:@"json"
                                          subdirectory:@"assets"];
    NSError *error;
    NSData *data = [NSData dataWithContentsOfURL:url
                                         options:0
                                           error:&error];
    
    NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data
                                                         options:0
                                                           error:&error];

    return [[JSContext currentContext][@"Promise"] invokeMethod:@"resolve"
                                                  withArguments:@[json]];
}

@end
