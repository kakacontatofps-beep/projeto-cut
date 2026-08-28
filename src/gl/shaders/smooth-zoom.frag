#version 300 es
precision highp float;

uniform sampler2D u_outgoing;
uniform sampler2D u_incoming;
uniform float u_progress;
uniform float u_zoom;

in vec2 v_texCoord;
out vec4 fragColor;

vec2 scaleUv(vec2 uv, float scale) {
  return clamp(vec2(0.5) + (uv - vec2(0.5)) / scale, 0.0, 1.0);
}

void main() {
  float p = smoothstep(0.0, 1.0, u_progress);
  vec4 outgoing = texture(u_outgoing, scaleUv(v_texCoord, 1.0 + u_zoom * p));
  vec4 incoming = texture(u_incoming, scaleUv(v_texCoord, 1.0 - u_zoom * (1.0 - p) * 0.55));
  fragColor = mix(outgoing, incoming, p);
}
