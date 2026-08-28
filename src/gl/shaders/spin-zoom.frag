#version 300 es
precision highp float;

uniform sampler2D u_outgoing;
uniform sampler2D u_incoming;
uniform float u_progress;
uniform float u_rotation;
uniform float u_zoom;

in vec2 v_texCoord;
out vec4 fragColor;

vec2 transformUv(vec2 uv, float angle, float scale) {
  vec2 p = uv - 0.5;
  float c = cos(angle);
  float s = sin(angle);
  p = mat2(c, -s, s, c) * p / scale;
  return clamp(p + 0.5, 0.0, 1.0);
}

void main() {
  float p = smoothstep(0.0, 1.0, u_progress);
  float pulse = sin(p * 3.14159265);
  vec4 outgoing = texture(u_outgoing, transformUv(v_texCoord, u_rotation * p, 1.0 + u_zoom * pulse));
  vec4 incoming = texture(u_incoming, transformUv(v_texCoord, -u_rotation * (1.0 - p), 1.0 + u_zoom * pulse));
  fragColor = mix(outgoing, incoming, p);
}
