#version 300 es
precision highp float;

uniform sampler2D u_outgoing;
uniform sampler2D u_incoming;
uniform float u_progress;
uniform vec2 u_dir;

in vec2 v_texCoord;
out vec4 fragColor;

vec4 sampleSafe(sampler2D image, vec2 uv) {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  return texture(image, uv);
}

void main() {
  float p = smoothstep(0.0, 1.0, u_progress);
  vec4 outgoing = sampleSafe(u_outgoing, v_texCoord + u_dir * p);
  vec4 incoming = sampleSafe(u_incoming, v_texCoord - u_dir * (1.0 - p));
  fragColor = outgoing.a > 0.001 ? outgoing : incoming;
}
