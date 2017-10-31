export const FragmentShader = `

#define MAX_TEXTURES 8

precision mediump float;

varying vec2 v_texcoord;
varying float v_texindex;

uniform sampler2D u_texture;

void main() {
  vec4 color = texture2D(u_texture, v_texcoord);
  if (color.a == 0.0) {
    discard;
  }
  gl_FragColor = color;
}

`;