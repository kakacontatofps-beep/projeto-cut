#version 300 es
precision highp float;
uniform sampler2D u_input;
uniform float u_intensity;
uniform float u_scanlines;
uniform float u_noise;
uniform float u_time;
in vec2 v_texCoord;
out vec4 fragColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.23, 289.17))) * 45758.5453); }
void main() {
  float wobble = sin(v_texCoord.y * 38.0 + u_time * 4.0) * 0.0025 * u_intensity;
  vec2 uv = clamp(v_texCoord + vec2(wobble, 0.0), 0.0, 1.0);
  vec2 split = vec2(0.004 * u_intensity, 0.0);
  vec4 center = texture(u_input, uv);
  vec3 color = vec3(
    texture(u_input, clamp(uv + split, 0.0, 1.0)).r,
    center.g,
    texture(u_input, clamp(uv - split, 0.0, 1.0)).b
  );
  float lines = 1.0 - (0.5 + 0.5 * sin(v_texCoord.y * 900.0)) * u_scanlines * 0.22;
  float grain = (hash(v_texCoord * 900.0 + floor(u_time * 24.0)) - 0.5) * u_noise;
  fragColor = vec4(clamp(color * lines + grain, 0.0, 1.0), center.a);
}
