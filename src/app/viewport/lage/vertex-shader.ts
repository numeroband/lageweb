export const VertexShader = `

attribute vec3 a_position;
attribute vec2 a_texcoord;
attribute float a_texindex;

varying vec2 v_texcoord;
varying float v_texindex;

void main() {
    gl_Position = vec4(a_position, 1.0);
    v_texcoord = a_texcoord;
    v_texindex = a_texindex;
}

`;