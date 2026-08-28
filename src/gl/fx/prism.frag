#version 300 es
precision highp float;
uniform sampler2D u_input;
uniform float u_amount;
uniform float u_angle;
uniform float u_falloff;
in vec2 v_texCoord;
out vec4 fragColor;
void main() {
  vec2 direction = vec2(cos(u_angle), sin(u_angle));
  float edge = pow(clamp(length(v_texCoord - 0.5) * 1.6, 0.0, 1.0), max(u_falloff, 0.1));
  vec2 offset = direction * u_amount * edge;
  vec4 center = texture(u_input, v_texCoord);
  float red = texture(u_input, clamp(v_texCoord + offset, 0.0, 1.0)).r;
  float blue = texture(u_input, clamp(v_texCoord - offset, 0.0, 1.0)).b;
  fragColor = vec4(red, center.g, blue, center.a);
}
