// Real Big Neto photo rendered with depth parallax and relighting. It is not a 3D model:
// the rotation range is limited on purpose. See docs/animation-architecture.md for the 360° path.

export interface BurgerState {
  yaw: number; // -1..1, roughly ±25° of apparent rotation
  pitch: number;
  explode: number; // 0 closed, 1 layers apart
  scale: number;
  x: number; // px offset from rest position
  y: number;
  shadow: number; // contact shadow strength, only visible on light backgrounds
}

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision highp float;
uniform sampler2D uTex,uDepth;
uniform vec2 uRes,uCenter,uSize;
uniform float uYaw,uPitch,uExplode,uShadow;

// Cuts between the four real layers, measured on the photo: y at centre, then edge droop.
float cut(int i,float x){
  float d=(x-.5)*(x-.5);
  // Wobble breaks the straight line a plain crop would leave.
  float w=.0035*sin(x*31.+float(i)*2.)+.0025*sin(x*73.+float(i)*5.)+.0015*sin(x*151.);
  if(i==0)return .296+.06*d+w;
  if(i==1)return .470+.02*d+w;
  return .645-.01*d+w;
}

vec2 parallax(vec2 uv,vec2 off){
  vec2 p=uv;
  for(int i=0;i<6;i++){p=uv-off*(texture2D(uDepth,p).r-.42);}
  return p;
}

void main(){
  vec2 frag=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  vec2 uv=(frag-uCenter)/uSize+.5;
  float gap=.07*uExplode;

  // Ellipse under the burger, below everything else.
  float s=length((uv-vec2(.5,.985+gap*1.5))*vec2(1.9,9.));
  float shadow=uShadow*.55*smoothstep(1.,.15,s);

  if(uv.x<-.15||uv.x>1.15||uv.y<-.5||uv.y>1.5){gl_FragColor=vec4(0.,0.,0.,shadow);return;}

  // Find which layer owns this pixel once the layers are spread apart.
  float y=-1.;float layer=0.;float cutFade=1.;
  for(int k=0;k<4;k++){
    float off=gap*(float(k)-1.5);
    float top=(k==0)?-.2:cut(k-1,uv.x);
    float bot=(k==3)?1.2:cut(k,uv.x);
    float yy=uv.y-off;
    if(yy>=top&&yy<bot){
      y=yy;layer=float(k);
      float e=min(yy-top,bot-yy);
      cutFade=(uExplode>.001)?smoothstep(0.,.004,e):1.;
    }
  }
  if(y<0.){gl_FragColor=vec4(0.,0.,0.,shadow);return;}

  // Layers turn a little out of step so the opened burger reads as a stack, not a slice of a poster.
  float twist=1.+uExplode*(layer-1.5)*.25;
  float drift=uExplode*(layer-1.5)*uYaw*.012;
  vec2 off=vec2(uYaw*.075*twist,uPitch*.05);
  vec2 q=parallax(vec2(uv.x+drift,y),off);
  q.x=.5+(q.x-.5)/(1.-abs(uYaw)*.04);

  if(q.x<0.||q.x>1.||q.y<0.||q.y>1.){gl_FragColor=vec4(0.,0.,0.,shadow);return;}
  vec4 c=texture2D(uTex,q);

  // Normal from the depth map so the light slides over the bun and cheese as it turns.
  float e=1./600.;
  float dx=texture2D(uDepth,q+vec2(e,0.)).r-texture2D(uDepth,q-vec2(e,0.)).r;
  float dy=texture2D(uDepth,q+vec2(0.,e)).r-texture2D(uDepth,q-vec2(0.,e)).r;
  vec3 n=normalize(vec3(-dx*9.,dy*9.,1.));
  vec3 l=normalize(vec3(uYaw*1.1-.25,.55+uPitch*.5,.8));
  float diff=.86+.34*max(dot(n,l),0.);
  float lum=dot(c.rgb,vec3(.3,.59,.11));
  float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),28.)*.32*smoothstep(.25,.75,lum);
  // Cut faces fall into shade so the gap has depth.
  float shade=1.-.45*uExplode*smoothstep(.03,0.,abs(y-(layer<.5?cut(0,uv.x):layer<1.5?cut(1,uv.x):layer<2.5?cut(2,uv.x):2.)));

  vec3 col=(c.rgb*diff+spec)*shade;
  float a=c.a*cutFade;
  gl_FragColor=vec4(col*a,a+shadow*(1.-a));
}`;

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
  return s;
}

async function texture(gl: WebGLRenderingContext, unit: number, url: string) {
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none' });
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  bmp.close();
}

export async function createBurger(
  canvas: HTMLCanvasElement,
  // rest: the burger's resting box, relative to the canvas.
  opts: { src: string; depth: string; state: BurgerState; rest: () => { left: number; top: number; width: number; height: number } },
) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.bindAttribLocation(prog, 0, 'p');
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  await Promise.all([texture(gl, 0, opts.src), texture(gl, 1, opts.depth)]);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  gl.uniform1i(u('uTex'), 0);
  gl.uniform1i(u('uDepth'), 1);
  const uRes = u('uRes'), uCenter = u('uCenter'), uSize = u('uSize'), uYaw = u('uYaw'), uPitch = u('uPitch'), uExplode = u('uExplode'), uShadow = u('uShadow');

  let dpr = 1, restBox = opts.rest(), frame = 0, visible = true, lost = false;

  // User input lives apart from the scroll-driven state so the two can never fight.
  const input = { yaw: 0, vel: 0, dragging: false, hoverYaw: 0, hoverPitch: 0, cy: 0, cp: 0 };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, innerWidth < 768 ? 1.75 : 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    restBox = opts.rest();
    invalidate();
  }

  function draw() {
    frame = 0;
    if (lost) return;
    let moving = false;
    if (!input.dragging && Math.abs(input.vel) > 0.0004) { input.yaw += input.vel; input.vel *= 0.93; moving = true; }
    else if (!input.dragging) { input.vel = 0; if (Math.abs(input.yaw) > 0.002) { input.yaw *= 0.97; moving = true; } }
    input.yaw = Math.max(-0.9, Math.min(0.9, input.yaw));
    const ease = (a: number, b: number) => { const n = a + (b - a) * 0.09; if (Math.abs(b - n) > 0.001) moving = true; return n; };
    input.cy = ease(input.cy, input.hoverYaw);
    input.cp = ease(input.cp, input.hoverPitch);

    const s = opts.state;
    const w = restBox.width * s.scale, h = restBox.height * s.scale;
    const cx = restBox.left + restBox.width / 2 + s.x;
    const cy = restBox.top + restBox.height / 2 + s.y;
    gl!.uniform2f(uRes, canvas.width, canvas.height);
    gl!.uniform2f(uCenter, cx * dpr, cy * dpr);
    gl!.uniform2f(uSize, w * dpr, h * dpr);
    gl!.uniform1f(uYaw, s.yaw + input.yaw + input.cy);
    gl!.uniform1f(uPitch, s.pitch + input.cp);
    gl!.uniform1f(uExplode, s.explode);
    gl!.uniform1f(uShadow, s.shadow);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (moving) invalidate();
  }

  // Draws on demand only: an idle hero costs no GPU.
  function invalidate() {
    if (!frame && visible) frame = requestAnimationFrame(draw);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) invalidate(); });
  io.observe(canvas);
  const onLost = (e: Event) => { e.preventDefault(); lost = true; canvas.dispatchEvent(new CustomEvent('burger:lost')); };
  canvas.addEventListener('webglcontextlost', onLost);
  resize();

  return {
    input,
    invalidate,
    refresh() { restBox = opts.rest(); invalidate(); },
    destroy() {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
