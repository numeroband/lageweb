export const VertexShader = `

attribute vec3 a_position;
attribute vec2 a_texcoord;

uniform vec4 u_camera;
uniform vec2 u_texrect;

varying vec2 v_texcoord;

void main() {
    gl_Position.x = -1.0 + 2.0 * (a_position.x - u_camera[0]) / u_camera[2];
    gl_Position.y = 1.0 - 2.0 * (a_position.y - u_camera[1]) / u_camera[3];
    gl_Position.z = (a_position.z + 1.0) / 100.0;
    gl_Position.w = 1.0;
    v_texcoord = a_texcoord / u_texrect;
}

`;