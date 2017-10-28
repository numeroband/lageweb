export const FragmentShader = `

#define MAX_TEXTURES 8

precision mediump float;

varying vec2 v_texcoord;
varying float v_texindex;

uniform sampler2D u_textures[MAX_TEXTURES];

vec4 colorFromTextureArray(int idx) {
  for (int ii = 0; ii < MAX_TEXTURES; ++ii) {
    if (ii == idx) {
      return texture2D(u_textures[ii], v_texcoord);
    }
  }
}

void main() {
  gl_FragColor = colorFromTextureArray(int(v_texindex));
}

`;