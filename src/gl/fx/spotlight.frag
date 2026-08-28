#version 300 es
precision highp float;
uniform sampler2D u_input;
uniform float u_center_x;
uniform float u_center_y;
uniform float u_radius;
uniform float u_feather;
uniform float u_strength;
uniform vec2 u_resolution;
in vec2 v_texCoord;
out vec4 fragColor;
void main() {
  vec4 source = texture(u_input, v_texCoord);
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 delta = (v_texCoord - vec2(u_center_x, u_center_y)) * vec2(aspect, 1.0);
  float light = 1.0 - smoothstep(u_radius, u_radius + max(u_feather, 0.001), length(delta));
  float exposure = mix(1.0 - u_strength, 1.0 + u_strength * 0.18, light);
  fragColor = vec4(clamp(source.rgb * exposure, 0.0, 1.0), source.a);
}
