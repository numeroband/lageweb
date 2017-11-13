//
//  Shaders.metal
//  LAGEJS
//
//  Created by Lorenzo Soto Doblado on 11/5/17.
//  Copyright © 2017 Lorenzo Soto Doblado. All rights reserved.
//

// File for Metal kernel and shader functions

#include <metal_stdlib>
#include <simd/simd.h>

// Including header shared between this Metal shader code and Swift/C code executing Metal API commands
#import "ShaderTypes.h"

using namespace metal;

typedef struct
{
    float4 position [[position]];
    float2 texCoord;
} ColorInOut;

vertex ColorInOut vertexShader(uint vertexID [[vertex_id]],
                               constant Quad *vertices [[ buffer(BufferIndexMeshPositions) ]],
                               constant Uniforms & uniforms [[ buffer(BufferIndexUniforms) ]])
{
    ColorInOut out;
    out.position = float4(-1.0 + 2.0 * (vertices[vertexID].position.x - uniforms.camera.x) / uniforms.camera.width,
                          1.0 - 2.0 * (vertices[vertexID].position.y - uniforms.camera.y) / uniforms.camera.height,
                          (vertices[vertexID].position.z + 1.0) / 100.0,
                          1.0);
    out.texCoord = float2(vertices[vertexID].texCoord.x / uniforms.textSize.x,
    vertices[vertexID].texCoord.y / uniforms.textSize.y);

    return out;
}

fragment float4 fragmentShader(ColorInOut in [[stage_in]],
                               texture2d<half> colorMap     [[ texture(TextureIndexColor) ]])
{
    constexpr sampler colorSampler(mip_filter::nearest,
                                   mag_filter::nearest,
                                   min_filter::nearest);

    half4 colorSample   = colorMap.sample(colorSampler, in.texCoord.xy);
    if (colorSample.a == 0.0)
    {
        discard_fragment();
    }
    return float4(colorSample);
}

