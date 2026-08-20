class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true, antialias: false, alpha: true });
    if (!this.gl) throw new Error('WebGL2 is not supported on this device.');

    const gl = this.gl;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const vs = `#version 300 es
      in vec2 a_pos;
      out vec2 v_uv;
      void main(){
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_uv = vec2(a_pos.x*.5+.5, 1.0-(a_pos.y*.5+.5));
      }`;

    const fs = `#version 300 es
      precision highp float;
      uniform sampler2D u_tex;
      uniform sampler2D u_mask;
      uniform vec2 u_res;
      uniform float u_exposure,u_brightness,u_contrast,u_highlights,u_shadows,u_whites,u_blacks;
      uniform float u_temp,u_tint,u_vibrance,u_saturation;
      uniform float u_sharpness,u_clarity,u_dehaze,u_vignette,u_grain,u_bloom;
      uniform float u_skinSmooth,u_skinGlow,u_skinWarmth,u_skinRedness,u_skinBrighten,u_skinEven,u_skinTexture;
      uniform float u_curveShadows,u_curveMids,u_curveHighlights;
      uniform float u_gamma,u_tonalShadows,u_tonalMids,u_tonalHighlights;
      uniform float u_levelsBlackIn,u_levelsGamma,u_levelsWhiteIn,u_levelsBlackOut,u_levelsWhiteOut;
      uniform float u_balanceSW,u_balanceST,u_balanceMW,u_balanceMT,u_balanceHW,u_balanceHT;
      uniform mat3 u_channelMixer;
      uniform float u_replaceHue,u_replaceRange,u_replaceShift,u_replaceSat,u_replaceLum;
      uniform float u_lensVignette,u_chromaAb,u_filmFade,u_halation,u_lensBlur;
      uniform float u_maskExposure,u_maskSaturation,u_maskTemp,u_maskContrast,u_maskBrightness;
      uniform float u_hslHue[8],u_hslSat[8],u_hslLum[8];
      in vec2 v_uv;
      out vec4 outColor;

      float lum(vec3 c){ return dot(c,vec3(.2126,.7152,.0722)); }
      float rand(vec2 co){ return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453); }
      float skinMask(vec3 c){
        float cb = .5 - .168736*c.r - .331264*c.g + .5*c.b;
        float cr = .5 + .5*c.r - .418688*c.g - .081312*c.b;
        float cbm = smoothstep(.23,.30,cb) * (1.0-smoothstep(.47,.54,cb));
        float crm = smoothstep(.50,.54,cr) * (1.0-smoothstep(.71,.77,cr));
        float brightness = smoothstep(.08,.22,lum(c));
        return clamp(cbm*crm*brightness,0.0,1.0);
      }
      vec3 rgb2hsv(vec3 c){
        vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);
        vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));
        vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));
        float d=q.x-min(q.w,q.y), e=1.0e-10;
        return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);
      }
      vec3 hsv2rgb(vec3 c){
        vec3 p=abs(fract(c.xxx+vec3(0.0,2.0/3.0,1.0/3.0))*6.0-3.0);
        return c.z*mix(vec3(1.0),clamp(p-1.0,0.0,1.0),c.y);
      }
      float hdist(float a,float b){float d=abs(a-b);return min(d,1.0-d);}
      float hweight(float h,float center){return 1.0-smoothstep(.035,.15,hdist(h,center));}

      void main(){
        vec2 t = 1.0/u_res;
        vec3 original = texture(u_tex,v_uv).rgb;
        if(u_chromaAb>.001){vec2 ca=t*u_chromaAb*4.0; original.r=texture(u_tex,v_uv+ca).r; original.b=texture(u_tex,v_uv-ca).b;}
        vec3 c = original;
        float skin = skinMask(c);

        if(u_skinSmooth > .001){
          vec3 blur = vec3(0.0);
          blur += texture(u_tex,v_uv+vec2(-t.x,-t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2( 0.0,-t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2( t.x,-t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2(-t.x, 0.0)).rgb;
          blur += texture(u_tex,v_uv+vec2( t.x, 0.0)).rgb;
          blur += texture(u_tex,v_uv+vec2(-t.x, t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2( 0.0, t.y)).rgb;
          blur += texture(u_tex,v_uv+vec2( t.x, t.y)).rgb;
          blur *= .125;
          c = mix(c, blur, skin*u_skinSmooth*.62);
        }
        c += skin*u_skinGlow*.07;
        c.r += skin*(u_skinWarmth*.045 + u_skinRedness*.035);
        c.g += skin*u_skinWarmth*.012;
        c.b -= skin*u_skinWarmth*.035;
        c.g -= skin*u_skinRedness*.018;
        c += vec3(skin*u_skinBrighten*.075);
        float skinY = lum(c);
        c = mix(c, vec3(skinY) + (c-vec3(skinY))*.82, skin*u_skinEven*.38);
        if(u_skinTexture > .001){
          vec3 around=(texture(u_tex,v_uv+vec2(t.x,0.0)).rgb+texture(u_tex,v_uv-vec2(t.x,0.0)).rgb+texture(u_tex,v_uv+vec2(0.0,t.y)).rgb+texture(u_tex,v_uv-vec2(0.0,t.y)).rgb)*.25;
          c += (original-around)*skin*u_skinTexture*.30;
        }

        if(u_lensBlur > .001){
          vec3 lb=texture(u_tex,v_uv+vec2(t.x*2.0,0.0)).rgb+texture(u_tex,v_uv-vec2(t.x*2.0,0.0)).rgb+texture(u_tex,v_uv+vec2(0.0,t.y*2.0)).rgb+texture(u_tex,v_uv-vec2(0.0,t.y*2.0)).rgb;
          lb*=.25; c=mix(c,lb,u_lensBlur*.72);
        }

        if(u_sharpness > .001 || abs(u_clarity) > .001){
          vec3 n=texture(u_tex,v_uv+vec2(0.0,-t.y)).rgb;
          vec3 s=texture(u_tex,v_uv+vec2(0.0,t.y)).rgb;
          vec3 e=texture(u_tex,v_uv+vec2(t.x,0.0)).rgb;
          vec3 w=texture(u_tex,v_uv+vec2(-t.x,0.0)).rgb;
          vec3 avg=(n+s+e+w)*.25;
          c += (c-avg)*(u_sharpness*.42 + u_clarity*.22);
        }

        c *= pow(2.0,u_exposure);
        c += u_brightness*.30;
        float l=lum(c);
        c += vec3(u_shadows*pow(max(0.0,1.0-l),2.0)*.32);
        c += vec3(u_highlights*pow(max(0.0,l),2.0)*.28);
        c += vec3(u_whites*smoothstep(.58,1.0,l)*.24);
        c += vec3(u_blacks*(1.0-smoothstep(.0,.42,l))*.20);
        c = (c-.5)*(1.0+u_contrast*.85)+.5;
        c = (c-.5)*(1.0+u_dehaze*.30)+.5 - vec3(u_dehaze*.025);

        c=clamp((c-vec3(u_levelsBlackIn))/max(vec3(.001),vec3(u_levelsWhiteIn-u_levelsBlackIn)),0.0,1.0);
        c=pow(max(c,vec3(0.0)),vec3(1.0/max(.05,u_levelsGamma)));
        c=mix(vec3(u_levelsBlackOut),vec3(u_levelsWhiteOut),c);
        c=pow(max(c,vec3(0.0)),vec3(1.0/max(.05,u_gamma)));
        float tl=lum(c), ts=pow(1.0-tl,2.0), th=pow(tl,2.0), tm=1.0-abs(tl*2.0-1.0);
        float tc=u_tonalShadows*ts+u_tonalMids*tm+u_tonalHighlights*th;
        c=(c-.5)*(1.0+tc*.34)+.5;

        c.r += u_temp*.075;
        c.b -= u_temp*.075;
        c.g += u_tint*.055;
        c.r -= u_tint*.018;
        c.b -= u_tint*.018;
        float bl=clamp(lum(c),0.0,1.0), bsw=pow(1.0-bl,2.0), bhw=pow(bl,2.0), bmw=1.0-abs(bl*2.0-1.0);
        float bw=u_balanceSW*bsw+u_balanceMW*bmw+u_balanceHW*bhw;
        float bt=u_balanceST*bsw+u_balanceMT*bmw+u_balanceHT*bhw;
        c.r+=bw*.055-bt*.012; c.b-=bw*.055+bt*.012; c.g+=bt*.045;
        c=u_channelMixer*c;

        float y=lum(c);
        float mx=max(c.r,max(c.g,c.b));
        float mn=min(c.r,min(c.g,c.b));
        float chroma=mx-mn;
        float vib=1.0+u_vibrance*(1.0-clamp(chroma,0.0,1.0))*.9;
        c=mix(vec3(y),c,vib);
        c=mix(vec3(lum(c)),c,1.0+u_saturation);

        float cy=clamp(lum(c),0.0,1.0);
        float sw=pow(1.0-cy,2.0), hw=pow(cy,2.0), mw=1.0-abs(cy*2.0-1.0);
        c += vec3((u_curveShadows*sw + u_curveMids*mw + u_curveHighlights*hw)*.22);

        vec3 hsv=rgb2hsv(clamp(c,0.0,1.0));
        float rw=1.0-smoothstep(max(.001,u_replaceRange*.45),max(.002,u_replaceRange),hdist(hsv.x,u_replaceHue));
        hsv.x=fract(hsv.x+rw*u_replaceShift*.28+1.0); hsv.y=clamp(hsv.y*(1.0+rw*u_replaceSat*.8),0.0,1.0); hsv.z=clamp(hsv.z+rw*u_replaceLum*.28,0.0,1.0);
        float centers[8]=float[8](0.0,.08,.16,.33,.50,.62,.75,.90);
        float sumw=0.0, dh=0.0, ds=0.0, dl=0.0;
        for(int i=0;i<8;i++){float w=hweight(hsv.x,centers[i]);sumw+=w;dh+=w*u_hslHue[i];ds+=w*u_hslSat[i];dl+=w*u_hslLum[i];}
        if(sumw>.001){hsv.x=fract(hsv.x+(dh/sumw)*.11+1.0);hsv.y=clamp(hsv.y*(1.0+(ds/sumw)*.72),0.0,1.0);hsv.z=clamp(hsv.z+(dl/sumw)*.24,0.0,1.0);c=hsv2rgb(hsv);}

        if(u_bloom>.001 || u_halation>.001){
          vec3 soft=(texture(u_tex,v_uv+vec2(t.x*2.0,0.0)).rgb+texture(u_tex,v_uv-vec2(t.x*2.0,0.0)).rgb+texture(u_tex,v_uv+vec2(0.0,t.y*2.0)).rgb+texture(u_tex,v_uv-vec2(0.0,t.y*2.0)).rgb)*.25;
          float hi=smoothstep(.62,.95,lum(c));
          c += soft*hi*u_bloom*.12;
          c += vec3(soft.r*.16,soft.g*.035,0.0)*hi*u_halation*.32;
        }
        if(u_filmFade>.001){c=mix(c,c*.84+vec3(.075,.066,.09),u_filmFade*.65);}

        float m = texture(u_mask,v_uv).a;
        if(m > .001){
          c *= pow(2.0,u_maskExposure*m);
          c += vec3(u_maskBrightness*.22*m);
          c = mix(c,(c-.5)*(1.0+u_maskContrast*.75)+.5,m);
          float ml=lum(c);
          c = mix(vec3(ml),c,1.0+u_maskSaturation*m);
          c.r += u_maskTemp*.07*m;
          c.b -= u_maskTemp*.07*m;
        }

        float d=distance(v_uv,vec2(.5));
        float lv=smoothstep(.25,.76,d)*u_lensVignette*.34;
        c*=1.0-lv;
        float vig=smoothstep(.28,.76,d)*u_vignette*.68;
        c*=1.0-vig;
        float g=(rand(v_uv*u_res+vec2(u_exposure*31.7,u_temp*19.3))-.5)*u_grain*.12;
        c += vec3(g);
        outColor=vec4(clamp(c,0.0,1.0),1.0);
      }`;

    this.program = this.createProgram(vs, fs);
    this.posLoc = gl.getAttribLocation(this.program, 'a_pos');
    this.uniforms = {};
    [
      'u_res','u_exposure','u_brightness','u_contrast','u_highlights','u_shadows','u_whites','u_blacks',
      'u_temp','u_tint','u_vibrance','u_saturation','u_sharpness','u_clarity','u_dehaze','u_vignette','u_grain','u_bloom',
      'u_skinSmooth','u_skinGlow','u_skinWarmth','u_skinRedness','u_skinBrighten','u_skinEven','u_skinTexture',
      'u_curveShadows','u_curveMids','u_curveHighlights',
      'u_gamma','u_tonalShadows','u_tonalMids','u_tonalHighlights',
      'u_levelsBlackIn','u_levelsGamma','u_levelsWhiteIn','u_levelsBlackOut','u_levelsWhiteOut',
      'u_balanceSW','u_balanceST','u_balanceMW','u_balanceMT','u_balanceHW','u_balanceHT','u_channelMixer',
      'u_replaceHue','u_replaceRange','u_replaceShift','u_replaceSat','u_replaceLum',
      'u_lensVignette','u_chromaAb','u_filmFade','u_halation','u_lensBlur',
      'u_maskExposure','u_maskSaturation','u_maskTemp','u_maskContrast','u_maskBrightness','u_tex','u_mask'
    ].forEach(n => this.uniforms[n] = gl.getUniformLocation(this.program, n));
    this.uniforms.u_hslHue = gl.getUniformLocation(this.program, 'u_hslHue[0]');
    this.uniforms.u_hslSat = gl.getUniformLocation(this.program, 'u_hslSat[0]');
    this.uniforms.u_hslLum = gl.getUniformLocation(this.program, 'u_hslLum[0]');

    const buf = gl.createBuffer();
    this.buffer = buf;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    this.texture = gl.createTexture();
    this.maskTexture = gl.createTexture();
    this.blankMask = document.createElement('canvas');
    this.blankMask.width = 1;
    this.blankMask.height = 1;
  }

  createProgram(vsSource, fsSource) {
    const gl = this.gl;
    const compile = (type, src) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  bindTexture(unit, texture, source) {
    const gl = this.gl;
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  render(source, params, maskSource = null) {
    const gl = this.gl;
    this.canvas.width = source.width;
    this.canvas.height = source.height;
    gl.viewport(0, 0, source.width, source.height);
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.posLoc);
    gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 0, 0);

    this.bindTexture(gl.TEXTURE0, this.texture, source);
    this.bindTexture(gl.TEXTURE1, this.maskTexture, maskSource || this.blankMask);
    gl.uniform1i(this.uniforms.u_tex, 0);
    gl.uniform1i(this.uniforms.u_mask, 1);

    gl.uniform2f(this.uniforms.u_res, source.width, source.height);
    gl.uniform1f(this.uniforms.u_exposure, params.exposure);
    gl.uniform1f(this.uniforms.u_brightness, params.brightness);
    gl.uniform1f(this.uniforms.u_contrast, params.contrast);
    gl.uniform1f(this.uniforms.u_highlights, params.highlights);
    gl.uniform1f(this.uniforms.u_shadows, params.shadows);
    gl.uniform1f(this.uniforms.u_whites, params.whites);
    gl.uniform1f(this.uniforms.u_blacks, params.blacks);
    gl.uniform1f(this.uniforms.u_temp, params.temperature);
    gl.uniform1f(this.uniforms.u_tint, params.tint);
    gl.uniform1f(this.uniforms.u_vibrance, params.vibrance);
    gl.uniform1f(this.uniforms.u_saturation, params.saturation);
    gl.uniform1f(this.uniforms.u_sharpness, params.sharpness);
    gl.uniform1f(this.uniforms.u_clarity, params.clarity);
    gl.uniform1f(this.uniforms.u_dehaze, params.dehaze);
    gl.uniform1f(this.uniforms.u_vignette, params.vignette);
    gl.uniform1f(this.uniforms.u_grain, params.grain);
    gl.uniform1f(this.uniforms.u_bloom, params.bloom);
    gl.uniform1f(this.uniforms.u_skinSmooth, params.skinSmooth);
    gl.uniform1f(this.uniforms.u_skinGlow, params.skinGlow);
    gl.uniform1f(this.uniforms.u_skinWarmth, params.skinWarmth);
    gl.uniform1f(this.uniforms.u_skinRedness, params.skinRedness);
    gl.uniform1f(this.uniforms.u_skinBrighten, params.skinBrighten);
    gl.uniform1f(this.uniforms.u_skinEven, params.skinEven);
    gl.uniform1f(this.uniforms.u_skinTexture, params.skinTexture);
    gl.uniform1f(this.uniforms.u_curveShadows, params.curveShadows);
    gl.uniform1f(this.uniforms.u_curveMids, params.curveMidtones);
    gl.uniform1f(this.uniforms.u_curveHighlights, params.curveHighlights);
    gl.uniform1f(this.uniforms.u_gamma, params.gamma);
    gl.uniform1f(this.uniforms.u_tonalShadows, params.tonalShadows);
    gl.uniform1f(this.uniforms.u_tonalMids, params.tonalMidtones);
    gl.uniform1f(this.uniforms.u_tonalHighlights, params.tonalHighlights);
    gl.uniform1f(this.uniforms.u_levelsBlackIn, params.levelsBlackIn);
    gl.uniform1f(this.uniforms.u_levelsGamma, params.levelsGamma);
    gl.uniform1f(this.uniforms.u_levelsWhiteIn, params.levelsWhiteIn);
    gl.uniform1f(this.uniforms.u_levelsBlackOut, params.levelsBlackOut);
    gl.uniform1f(this.uniforms.u_levelsWhiteOut, params.levelsWhiteOut);
    gl.uniform1f(this.uniforms.u_balanceSW, params.balanceShadowWarmth);
    gl.uniform1f(this.uniforms.u_balanceST, params.balanceShadowTint);
    gl.uniform1f(this.uniforms.u_balanceMW, params.balanceMidWarmth);
    gl.uniform1f(this.uniforms.u_balanceMT, params.balanceMidTint);
    gl.uniform1f(this.uniforms.u_balanceHW, params.balanceHighWarmth);
    gl.uniform1f(this.uniforms.u_balanceHT, params.balanceHighTint);
    gl.uniformMatrix3fv(this.uniforms.u_channelMixer, false, new Float32Array([params.mixRR,params.mixGR,params.mixBR,params.mixRG,params.mixGG,params.mixBG,params.mixRB,params.mixGB,params.mixBB]));
    gl.uniform1f(this.uniforms.u_replaceHue, params.replaceHue);
    gl.uniform1f(this.uniforms.u_replaceRange, params.replaceRange);
    gl.uniform1f(this.uniforms.u_replaceShift, params.replaceShift);
    gl.uniform1f(this.uniforms.u_replaceSat, params.replaceSat);
    gl.uniform1f(this.uniforms.u_replaceLum, params.replaceLum);
    gl.uniform1f(this.uniforms.u_lensVignette, params.lensVignette);
    gl.uniform1f(this.uniforms.u_chromaAb, params.chromaticAberration);
    gl.uniform1f(this.uniforms.u_filmFade, params.filmFade);
    gl.uniform1f(this.uniforms.u_halation, params.halation);
    gl.uniform1f(this.uniforms.u_lensBlur, params.lensBlur);
    gl.uniform1f(this.uniforms.u_maskExposure, params.maskExposure);
    gl.uniform1f(this.uniforms.u_maskSaturation, params.maskSaturation);
    gl.uniform1f(this.uniforms.u_maskTemp, params.maskTemperature);
    gl.uniform1f(this.uniforms.u_maskContrast, params.maskContrast);
    gl.uniform1f(this.uniforms.u_maskBrightness, params.maskBrightness);
    gl.uniform1fv(this.uniforms.u_hslHue, new Float32Array(HSL_COLORS.map(([k]) => params[`hsl_${k}_h`] || 0)));
    gl.uniform1fv(this.uniforms.u_hslSat, new Float32Array(HSL_COLORS.map(([k]) => params[`hsl_${k}_s`] || 0)));
    gl.uniform1fv(this.uniforms.u_hslLum, new Float32Array(HSL_COLORS.map(([k]) => params[`hsl_${k}_l`] || 0)));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('lumi-ai-pwa', 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function dbTx(mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction('projects', mode);
    const store = tx.objectStore('projects');
    fn(store);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function putProject(project) { await dbTx('readwrite', s => s.put(project)); }
async function deleteProject(id) { await dbTx('readwrite', s => s.delete(id)); }
async function clearProjects() { await dbTx('readwrite', s => s.clear()); }
