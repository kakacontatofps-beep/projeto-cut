#version 300 es
precision highp float;

uniform sampler2D u_outgoing;
uniform sampler2D u_incoming;
uniform float u_progress;
uniform float u_blocks;
uniform float u_softness;

in vec2 v_texCoord;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 cell = floor(v_texCoord * max(u_blocks, 2.0));
  float threshold = hash(cell);
  float mask = smoothstep(threshold - u_softness, threshold + u_softness, u_progress);
  fragColor = mix(texture(u_outgoing, v_texCoord), texture(u_incoming, v_texCoord), mask);
}
