#version 300 es
precision highp float;

uniform sampler2D u_outgoing;
uniform sampler2D u_incoming;
uniform float u_progress;
uniform float u_intensity;
uniform vec3 u_burnColor;

in vec2 v_texCoord;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  float p = smoothstep(0.0, 1.0, u_progress);
  vec4 base = mix(texture(u_outgoing, v_texCoord), texture(u_incoming, v_texCoord), p);
  float centerFlash = pow(max(0.0, 1.0 - abs(p - 0.5) * 2.0), 2.2);
  float grain = hash(floor(v_texCoord * 180.0) + floor(p * 30.0));
  float burn = centerFlash * u_intensity * (0.78 + grain * 0.22);
  vec3 screened = 1.0 - (1.0 - base.rgb) * (1.0 - u_burnColor * burn);
  fragColor = vec4(clamp(screened, 0.0, 1.0), base.a);
}
