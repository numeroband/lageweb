//
//  Resources.h
//  LAGEJS
//
//  Created by Lorenzo Soto Doblado on 11/5/17.
//  Copyright © 2017 Lorenzo Soto Doblado. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

@protocol ResourcesExport <JSExport>
- (JSValue*)loadJson:(NSString*)name;
@end

@interface Resources : NSObject<ResourcesExport>

@end
