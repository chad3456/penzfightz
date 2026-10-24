import { BLUR, COMPOSE, COPY, FINAL, LOOK, VERT } from './shaders';

export const WORK_W = 720;
export const WORK_H = 1280;

export interface FrameParams {
  source: TexImageSource | null; // null: reuse the frame already held (freeze)
  srcW: number;
  srcH: number;
  mode: 0 | 1; // crop, fit
  cropX: number;
  mask: Uint8Array | null; // bottom-up rows, maskW x maskH
  maskW: number;
  maskH: number;
  look: number;
  time: number;
  p: number;
  pulse: number;
  seed: number;
  freeze: boolean;
  hold: boolean; // capture this frame as the held one
  flashAdd: number;
  zoom: number;
  center: [number, number];
  shift: [number, number];
  rgb: number;
  chroma: number;
  flash: number;
  letterbox: boolean;
  tint: [number, number, number];
}

interface Target { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number }

export class AuraRenderer {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private progs: Record<string, { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }> = {};
  private vao: WebGLVertexArrayObject;
  private video: WebGLTexture;
  private maskTex: WebGLTexture;
  private t: Record<string, Target> = {};
  private maskSize = [0, 0];

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? document.createElement('canvas');
    this.canvas.width = WORK_W;
    this.canvas.height = WORK_H;
    const gl = this.canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 is not available in this browser');
    this.gl = gl;
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const [name, src] of Object.entries({ compose: COMPOSE, copy: COPY, blur: BLUR, look: LOOK, final: FINAL })) this.progs[name] = this.program(src);
    this.video = this.texture(true);
    this.maskTex = this.texture(false);
    const T = (w: number, h: number) => this.target(w, h);
    this.t = {
      frame: T(WORK_W, WORK_H), held: T(WORK_W, WORK_H), look: T(WORK_W, WORK_H),
      d1: T(WORK_W / 4, WORK_H / 4), b1: T(WORK_W / 4, WORK_H / 4), x1: T(WORK_W / 4, WORK_H / 4),
      d2: T(WORK_W / 8, WORK_H / 8), b2: T(WORK_W / 8, WORK_H / 8), x2: T(WORK_W / 8, WORK_H / 8),
    };
  }

  private program(frag: string) {
    const gl = this.gl;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    const u: Record<string, WebGLUniformLocation | null> = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i)!; u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  }

  private texture(mip: boolean) {
    const gl = this.gl;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  private target(w: number, h: number): Target {
    const gl = this.gl;
    const tex = this.texture(false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { fb, tex, w, h };
  }

  private maskTargets(w: number, h: number) {
    if (this.maskSize[0] === w && this.maskSize[1] === h) return;
    this.maskSize = [w, h];
    this.t.mx = this.target(w, h); this.t.mn = this.target(w, h);
    const hw = Math.max(8, w >> 1), hh = Math.max(8, h >> 1);
    this.t.mw1 = this.target(hw, hh); this.t.mwt = this.target(hw, hh); this.t.mw = this.target(hw, hh); this.t.mnt = this.target(w, h);
  }

  private pass(name: string, out: Target | null, set: (u: Record<string, WebGLUniformLocation | null>, gl: WebGL2RenderingContext) => void, tex: WebGLTexture[] = []) {
    const gl = this.gl;
    const { p, u } = this.progs[name];
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fb : null);
    gl.viewport(0, 0, out ? out.w : this.canvas.width, out ? out.h : this.canvas.height);
    tex.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
    set(u, gl);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private blurInto(src: Target, tmp: Target, dst: Target, times = 1) {
    let from = src;
    for (let k = 0; k < times; k++) {
      this.pass('blur', tmp, (u, gl) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uDir, 1 / tmp.w, 0); }, [from.tex]);
      this.pass('blur', dst, (u, gl) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uDir, 0, 1 / dst.h); }, [tmp.tex]);
      from = dst;
    }
  }

  render(f: FrameParams) {
    const gl = this.gl;
    const map = (u: Record<string, WebGLUniformLocation | null>) => {
      gl.uniform2f(u.uSrcSize, f.srcW, f.srcH);
      gl.uniform2f(u.uOutSize, WORK_W, WORK_H);
      gl.uniform1i(u.uMode, f.mode);
      gl.uniform1f(u.uCropX, f.cropX);
    };
    // 1. compose the 9:16 frame (or keep the held one during a freeze)
    const frame = f.freeze && !f.hold ? this.t.held : f.hold ? this.t.held : this.t.frame;
    if (f.source && (!f.freeze || f.hold)) {
      gl.bindTexture(gl.TEXTURE_2D, this.video);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, f.source);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.pass('compose', frame, (u) => { map(u); gl.uniform1i(u.uVideo, 0); }, [this.video]);
    }
    // 2. blurred copies of the frame
    const { d1, b1, x1, d2, b2, x2 } = this.t;
    this.pass('copy', d1, (u) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uTexel, 1 / frame.w, 1 / frame.h); }, [frame.tex]);
    this.blurInto(d1, x1, b1, 2);
    this.pass('copy', d2, (u) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uTexel, 1 / b1.w, 1 / b1.h); }, [b1.tex]);
    this.blurInto(d2, x2, b2, 2);
    // 3. the person mask and two blurred versions of it (narrow and wide glow)
    const hasMask = !!f.mask && f.maskW > 0;
    if (hasMask) {
      this.maskTargets(f.maskW, f.maskH);
      gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, f.maskW, f.maskH, 0, gl.RED, gl.UNSIGNED_BYTE, f.mask);
      this.pass('copy', this.t.mx, (u) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uTexel, 0, 0); }, [this.maskTex]);
      this.blurInto(this.t.mx, this.t.mnt, this.t.mn, 1);
      this.pass('copy', this.t.mw1, (u) => { gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uTexel, 1 / f.maskW, 1 / f.maskH); }, [this.t.mx.tex]);
      this.blurInto(this.t.mw1, this.t.mwt, this.t.mw, 3);
    }
    // 4. the look
    const mt = hasMask ? [this.maskTex, this.t.mn.tex, this.t.mw.tex] : [this.maskTex, this.maskTex, this.maskTex];
    this.pass('look', this.t.look, (u) => {
      map(u);
      gl.uniform1i(u.uFrame, 0); gl.uniform1i(u.uBlur, 1); gl.uniform1i(u.uBlur2, 2);
      gl.uniform1i(u.uMask, 3); gl.uniform1i(u.uMaskN, 4); gl.uniform1i(u.uMaskW, 5);
      gl.uniform1i(u.uLook, f.look);
      gl.uniform1f(u.uTime, f.time); gl.uniform1f(u.uP, f.p); gl.uniform1f(u.uPulse, f.pulse); gl.uniform1f(u.uSeed, f.seed);
      gl.uniform3f(u.uTint, f.tint[0], f.tint[1], f.tint[2]); gl.uniform1f(u.uFreeze, f.freeze ? 1 : 0); gl.uniform1f(u.uHasMask, hasMask ? 1 : 0); gl.uniform1f(u.uFlashAdd, f.flashAdd);
      gl.uniform2f(u.uRes, WORK_W, WORK_H);
    }, [frame.tex, b1.tex, b2.tex, ...mt]);
    // 5. beat motion to the canvas
    this.pass('final', null, (u) => {
      gl.uniform1i(u.uTex, 0);
      gl.uniform2f(u.uRes, WORK_W, WORK_H);
      gl.uniform2f(u.uCenter, f.center[0], f.center[1]);
      gl.uniform2f(u.uShift, f.shift[0], f.shift[1]);
      gl.uniform1f(u.uZoom, f.zoom); gl.uniform1f(u.uRGB, f.rgb); gl.uniform1f(u.uChroma, f.chroma);
      gl.uniform1f(u.uFlash, f.flash); gl.uniform1f(u.uLetterbox, f.letterbox ? 1 : 0);
    }, [this.t.look.tex]);
  }

  dispose() { this.gl.getExtension('WEBGL_lose_context')?.loseContext(); }
}
