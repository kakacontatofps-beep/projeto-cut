#version 300 es
precision highp float;
uniform sampler2D u_input;
uniform float u_size;
uniform float u_softness;
in vec2 v_texCoord;
out vec4 fragColor;
void main() {
  vec4 source = texture(u_input, v_texCoord);
  float edge = min(v_texCoord.y, 1.0 - v_texCoord.y);
  float visible = smoothstep(u_size, u_size + max(u_softness, 0.0001), edge);
  fragColor = vec4(source.rgb * visible, source.a);
}
