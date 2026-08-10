(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,74452,(e,t,r)=>{t.exports={vpp:{angles:[52,60,75,90,110,120,135,150],speeds:[6,8,10,12,14,16,20],52:[4.98,5.86,6.31,6.45,6.51,6.52,6.41],60:[5.25,6.11,6.56,6.73,6.79,6.82,6.79],75:[5.45,6.33,6.77,7.01,7.13,7.2,7.24],90:[5.66,6.55,7,7.25,7.38,7.53,7.7],110:[5.49,6.49,7.04,7.4,7.69,7.97,8.38],120:[5.32,6.36,6.97,7.39,7.77,8.1,8.6],135:[4.81,5.92,6.68,7.15,7.55,7.95,8.85],150:[4.09,5.17,6.04,6.61,6.99,7.31,7.93],beat_angle:[43.6,42,41.2,41.2,41.7,42.1,44.2],beat_vmg:[3.26,3.91,4.24,4.34,4.36,4.34,4.16],run_angle:[144.8,147.8,148.5,149.6,171.8,175.4,177.2],run_vmg:[3.54,4.48,5.23,5.73,6.17,6.67,7.36]}}},67225,e=>{"use strict";var t,r,o,a,n=e.i(43476),i=e.i(71645),l=e.i(30297),s=e.i(82897),u=e.i(60099),c=e.i(43257),m=e.i(66326),d=e.i(25234),f=e.i(67335),h=e.i(90072),p=e.i(67561),v=e.i(85709);let g=(t={time:0,speed:1,scale:3,opacity:.4,color:new h.Color(17510),foamColor:new h.Color(8965375),waterColor:new h.Color(6694),rainbowActive:0},r=`
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      
      // Add subtle vertex displacement for a wavy effect.
      float elevation = sin(position.x * 0.2 + position.y * 0.3) * 0.05;
      vElevation = elevation;
      vec3 newPosition = position + normal * elevation;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,o=`
    uniform float time;
    uniform float speed;
    uniform float scale;
    uniform float opacity;
    uniform vec3 color;
    uniform vec3 foamColor;
    uniform vec3 waterColor;
    uniform float rainbowActive;

    varying vec2 vUv;
    varying float vElevation;

    // Standard noise functions.
    vec4 permute(vec4 x) {
      return mod(((x * 34.0) + 1.0) * x, 289.0);
    }

    vec2 fade(vec2 t) {
      return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
    }

    float cnoise(vec2 P) {
      vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
      vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
      Pi = mod(Pi, 289.0);
      vec4 ix = Pi.xzxz;
      vec4 iy = Pi.yyww;
      vec4 fx = Pf.xzxz;
      vec4 fy = Pf.yyww;
      vec4 i = permute(permute(ix) + iy);
      vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
      vec4 gy = abs(gx) - 0.5;
      vec4 tx = floor(gx + 0.5);
      gx = gx - tx;
      vec2 g00 = vec2(gx.x, gy.x);
      vec2 g10 = vec2(gx.y, gy.y);
      vec2 g01 = vec2(gx.z, gy.z);
      vec2 g11 = vec2(gx.w, gy.w);
      vec4 norm = 1.79284291400159 - 0.85373472095314 *
                  vec4(dot(g00, g00), dot(g10, g10), dot(g01, g01), dot(g11, g11));
      g00 *= norm.x;
      g10 *= norm.y;
      g01 *= norm.z;
      g11 *= norm.w;
      float n00 = dot(g00, vec2(fx.x, fy.x));
      float n10 = dot(g10, vec2(fx.y, fy.y));
      float n01 = dot(g01, vec2(fx.z, fy.z));
      float n11 = dot(g11, vec2(fx.w, fy.w));
      vec2 fade_xy = fade(Pf.xy);
      vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
      float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
      return 2.3 * n_xy;
    }

    vec3 hsl2rgb(vec3 hsl) {
      vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
                       0.0, 1.0);
      rgb = rgb * rgb * (3.0 - 2.0 * rgb);
      return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0 * hsl.z - 1.0));
    }

    void main() {
      float baseNoise = cnoise(vUv * scale + vec2(time * speed, 0.0));
      float detailNoise = cnoise(vUv * scale * 2.0 + vec2(time * speed * 1.5, 0.0)) * 0.5;
      float turbulence = cnoise(vUv * scale * 4.0 + vec2(time * speed * 2.0, 0.0)) * 0.25;
      float noise = baseNoise + detailNoise + turbulence;
      
      float wake = smoothstep(0.3, 0.7, 1.0 - abs(vUv.x - 0.5) * 2.0);
      float foam = smoothstep(0.4, 0.6, noise + wake);
      
      vec3 finalColor = mix(waterColor, foamColor, foam);
      finalColor = mix(finalColor, color, wake * 0.3);
      
      float alpha = opacity * (wake + foam * 0.4) * (1.0 - vUv.y);
      
      float highlight = smoothstep(0.2, 0.4, noise + wake) *
                        (1.0 - smoothstep(0.4, 0.6, noise + wake));
      finalColor += highlight * foamColor * 0.3;
      
      if (rainbowActive > 0.5) {
        float rainbowHue = mod(vUv.x + time * 0.3, 1.0);
        vec3 rainbowColor = hsl2rgb(vec3(rainbowHue, 0.8, 0.5));
        finalColor = mix(finalColor, rainbowColor, 0.5);
      }
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,(a=class extends h.ShaderMaterial{constructor(e){for(const a in super({vertexShader:r,fragmentShader:o,...e}),t)this.uniforms[a]=new h.Uniform(t[a]),Object.defineProperty(this,a,{get(){return this.uniforms[a].value},set(e){this.uniforms[a].value=e}});this.uniforms=h.UniformsUtils.clone(this.uniforms)}}).key=h.MathUtils.generateUUID(),a);(0,f.extend)({TrailShaderMaterial:g});let x=({color:e="#004466",waterColor:t="#001a26",foamColor:r="#88ccff",speed:o=1,scale:a=3,opacity:l=.4})=>{let s=(0,i.useRef)(),{nightMode:u}=(0,p.useOcearoContext)(),c=(0,v.useSignalKPath)("steering.autopilot.state"),m=(0,i.useRef)(!1);(0,i.useEffect)(()=>{m.current="auto"===c},[c]),(0,d.useFrame)((e,t)=>{s.current&&(s.current.uniforms.time.value+=t,s.current.uniforms.rainbowActive.value=+!!m.current)});let f=(0,i.useMemo)(()=>new h.Color(u?"#002233":e),[u,e]),g=(0,i.useMemo)(()=>new h.Color(u?"#000811":t),[u,t]),x=(0,i.useMemo)(()=>new h.Color(u?p.oBlue:r),[u,r]);return(0,n.jsxs)("mesh",{rotation:[-Math.PI/2,0,Math.PI/2],position:[0,0,22.5],children:[(0,n.jsx)("planeGeometry",{args:[40,2.2,128,32]}),(0,n.jsx)("trailShaderMaterial",{ref:s,color:f,waterColor:g,foamColor:x,speed:o,scale:a,opacity:l,transparent:!0,depthWrite:!1,blending:h.AdditiveBlending})]})};var M=e.i(28600),w=e.i(60602),y=h,b=e.i(8560);class C extends y.Mesh{constructor(e,t={}){super(e),this.isWater=!0;const r=this,o=void 0!==t.textureWidth?t.textureWidth:512,a=void 0!==t.textureHeight?t.textureHeight:512,n=void 0!==t.clipBias?t.clipBias:0,i=void 0!==t.alpha?t.alpha:1,l=void 0!==t.time?t.time:0,s=void 0!==t.waterNormals?t.waterNormals:null,u=void 0!==t.sunDirection?t.sunDirection:new y.Vector3(.70707,.70707,0),c=new y.Color(void 0!==t.sunColor?t.sunColor:0xffffff),m=new y.Color(void 0!==t.waterColor?t.waterColor:8355711),d=void 0!==t.eye?t.eye:new y.Vector3(0,0,0),f=void 0!==t.distortionScale?t.distortionScale:20,h=void 0!==t.side?t.side:y.FrontSide,p=void 0!==t.fog&&t.fog,v=new y.Plane,g=new y.Vector3,x=new y.Vector3,M=new y.Vector3,w=new y.Matrix4,C=new y.Vector3(0,0,-1),S=new y.Vector4,P=new y.Vector3,T=new y.Vector3,j=new y.Vector4,R=new y.Matrix4,E=new y.PerspectiveCamera,D=new y.WebGLRenderTarget(o,a,{type:y.HalfFloatType}),_={name:"MirrorShader",uniforms:y.UniformsUtils.merge([b.UniformsLib.fog,b.UniformsLib.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new y.Matrix4},sunColor:{value:new y.Color(8355711)},sunDirection:{value:new y.Vector3(.70707,.70707,0)},eye:{value:new y.Vector3},waterColor:{value:new y.Color(5592405)}}]),vertexShader:`
				uniform mat4 textureMatrix;
				uniform float time;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				#include <common>
				#include <fog_pars_vertex>
				#include <shadowmap_pars_vertex>
				#include <logdepthbuf_pars_vertex>

				void main() {
					mirrorCoord = modelMatrix * vec4( position, 1.0 );
					worldPosition = mirrorCoord.xyzw;
					mirrorCoord = textureMatrix * mirrorCoord;
					vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
					gl_Position = projectionMatrix * mvPosition;

				#include <beginnormal_vertex>
				#include <defaultnormal_vertex>
				#include <logdepthbuf_vertex>
				#include <fog_vertex>
				#include <shadowmap_vertex>
			}`,fragmentShader:`
				uniform sampler2D mirrorSampler;
				uniform float alpha;
				uniform float time;
				uniform float size;
				uniform float distortionScale;
				uniform sampler2D normalSampler;
				uniform vec3 sunColor;
				uniform vec3 sunDirection;
				uniform vec3 eye;
				uniform vec3 waterColor;

				varying vec4 mirrorCoord;
				varying vec4 worldPosition;

				vec4 getNoise( vec2 uv ) {
					vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
					vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
					vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
					vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
					vec4 noise = texture2D( normalSampler, uv0 ) +
						texture2D( normalSampler, uv1 ) +
						texture2D( normalSampler, uv2 ) +
						texture2D( normalSampler, uv3 );
					return noise * 0.5 - 1.0;
				}

				void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
					vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
					float direction = max( 0.0, dot( eyeDirection, reflection ) );
					specularColor += pow( direction, shiny ) * sunColor * spec;
					diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
				}

				#include <common>
				#include <packing>
				#include <bsdfs>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <lights_pars_begin>
				#include <shadowmap_pars_fragment>
				#include <shadowmask_pars_fragment>

				void main() {

					#include <logdepthbuf_fragment>
					vec4 noise = getNoise( worldPosition.xz * size );
					vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

					vec3 diffuseLight = vec3(0.0);
					vec3 specularLight = vec3(0.0);

					vec3 worldToEye = eye-worldPosition.xyz;
					vec3 eyeDirection = normalize( worldToEye );
					sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

					float distance = length(worldToEye);

					vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
					vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );

					float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
					float rf0 = 0.02;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), reflectionSample + specularLight, reflectance );
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},A=new y.ShaderMaterial({name:_.name,uniforms:y.UniformsUtils.clone(_.uniforms),vertexShader:_.vertexShader,fragmentShader:_.fragmentShader,lights:!0,side:h,fog:p});A.uniforms.mirrorSampler.value=D.texture,A.uniforms.textureMatrix.value=R,A.uniforms.alpha.value=i,A.uniforms.time.value=l,A.uniforms.normalSampler.value=s,A.uniforms.sunColor.value=c,A.uniforms.waterColor.value=m,A.uniforms.sunDirection.value=u,A.uniforms.distortionScale.value=f,A.uniforms.eye.value=d,r.material=A,r.onBeforeRender=function(e,t,o){if(x.setFromMatrixPosition(r.matrixWorld),M.setFromMatrixPosition(o.matrixWorld),w.extractRotation(r.matrixWorld),g.set(0,0,1),g.applyMatrix4(w),P.subVectors(x,M),P.dot(g)>0)return;P.reflect(g).negate(),P.add(x),w.extractRotation(o.matrixWorld),C.set(0,0,-1),C.applyMatrix4(w),C.add(M),T.subVectors(x,C),T.reflect(g).negate(),T.add(x),E.position.copy(P),E.up.set(0,1,0),E.up.applyMatrix4(w),E.up.reflect(g),E.lookAt(T),E.far=o.far,E.updateMatrixWorld(),E.projectionMatrix.copy(o.projectionMatrix),R.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),R.multiply(E.projectionMatrix),R.multiply(E.matrixWorldInverse),v.setFromNormalAndCoplanarPoint(g,x),v.applyMatrix4(E.matrixWorldInverse),S.set(v.normal.x,v.normal.y,v.normal.z,v.constant);let a=E.projectionMatrix;j.x=(Math.sign(S.x)+a.elements[8])/a.elements[0],j.y=(Math.sign(S.y)+a.elements[9])/a.elements[5],j.z=-1,j.w=(1+a.elements[10])/a.elements[14],S.multiplyScalar(2/S.dot(j)),a.elements[2]=S.x,a.elements[6]=S.y,a.elements[10]=S.z+1-n,a.elements[14]=S.w,d.setFromMatrixPosition(o.matrixWorld);let i=e.getRenderTarget(),l=e.xr.enabled,s=e.shadowMap.autoUpdate;r.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(D),e.state.buffers.depth.setMask(!0),!1===e.autoClear&&e.clear(),e.render(t,E),r.visible=!0,e.xr.enabled=l,e.shadowMap.autoUpdate=s,e.setRenderTarget(i);let u=o.viewport;void 0!==u&&e.state.viewport(u)}}}var S=h;class P extends S.Mesh{constructor(){const e=P.SkyShader,t=new S.ShaderMaterial({name:e.name,uniforms:S.UniformsUtils.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:S.BackSide,depthWrite:!1});super(new S.BoxGeometry(1,1,1),t),this.isSky=!0}}P.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new S.Vector3},up:{value:new S.Vector3(0,1,0)},cloudScale:{value:2e-4},cloudSpeed:{value:1e-4},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calculation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorption + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;
		uniform float cloudScale;
		uniform float cloudSpeed;
		uniform float cloudCoverage;
		uniform float cloudDensity;
		uniform float cloudElevation;
		uniform float showSunDisc;
		uniform float time;

		// Cloud noise functions
		float hash( vec2 p ) {
			return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453123 );
		}

		float noise( vec2 p ) {
			vec2 i = floor( p );
			vec2 f = fract( p );
			f = f * f * ( 3.0 - 2.0 * f );
			float a = hash( i );
			float b = hash( i + vec2( 1.0, 0.0 ) );
			float c = hash( i + vec2( 0.0, 1.0 ) );
			float d = hash( i + vec2( 1.0, 1.0 ) );
			return mix( mix( a, b, f.x ), mix( c, d, f.x ), f.y );
		}

		float fbm( vec2 p ) {
			float value = 0.0;
			float amplitude = 0.5;
			for ( int i = 0; i < 5; i ++ ) {
				value += amplitude * noise( p );
				p *= 2.0;
				amplitude *= 0.5;
			}
			return value;
		}

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisc = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta ) * showSunDisc;
			L0 += ( vSunE * 19000.0 * Fex ) * sundisc;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			// Clouds
			if ( direction.y > 0.0 && cloudCoverage > 0.0 ) {

				// Project to cloud plane (higher elevation = clouds appear lower/closer)
				float elevation = mix( 1.0, 0.1, cloudElevation );
				vec2 cloudUV = direction.xz / ( direction.y * elevation );
				cloudUV *= cloudScale;
				cloudUV += time * cloudSpeed;

				// Multi-octave noise for fluffy clouds
				float cloudNoise = fbm( cloudUV * 1000.0 );
				cloudNoise += 0.5 * fbm( cloudUV * 2000.0 + 3.7 );
				cloudNoise = cloudNoise * 0.5 + 0.5;

				// Apply coverage threshold
				float cloudMask = smoothstep( 1.0 - cloudCoverage, 1.0 - cloudCoverage + 0.3, cloudNoise );

				// Fade clouds near horizon (adjusted by elevation)
				float horizonFade = smoothstep( 0.0, 0.1 + 0.2 * cloudElevation, direction.y );
				cloudMask *= horizonFade;

				// Cloud lighting based on sun position
				float sunInfluence = dot( direction, vSunDirection ) * 0.5 + 0.5;
				float daylight = max( 0.0, vSunDirection.y * 2.0 );

				// Base cloud color affected by atmosphere
				vec3 atmosphereColor = Lin * 0.04;
				vec3 cloudColor = mix( vec3( 0.3 ), vec3( 1.0 ), daylight );
				cloudColor = mix( cloudColor, atmosphereColor + vec3( 1.0 ), sunInfluence * 0.5 );
				cloudColor *= vSunE * 0.00002;

				// Blend clouds with sky
				texColor = mix( texColor, cloudColor, cloudMask * cloudDensity );

			}

			gl_FragColor = vec4( texColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};var T=e.i(83934);let j=e=>e===Object(e)&&!Array.isArray(e)&&"function"!=typeof e;function R(e,t){let r=(0,M.useThree)(e=>e.gl),o=(0,w.useLoader)(h.TextureLoader,j(e)?Object.values(e):e);return(0,i.useLayoutEffect)(()=>{null==t||t(o)},[t]),(0,i.useEffect)(()=>{if("initTexture"in r){let e=[];Array.isArray(o)?e=o:o instanceof h.Texture?e=[o]:j(o)&&(e=Object.values(o)),e.forEach(e=>{e instanceof h.Texture&&r.initTexture(e)})}},[r,o]),(0,i.useMemo)(()=>{if(!j(e))return o;{let t={},r=0;for(let a in e)t[a]=o[r++];return t}},[e,o])}R.preload=e=>w.useLoader.preload(h.TextureLoader,e),R.clear=e=>w.useLoader.clear(h.TextureLoader,e);var E=h;let D=parseInt(h.REVISION.replace(/\D+/g,""));class _ extends E.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
      uniform float time;
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
        gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
        gl_Position = projectionMatrix * mvPosition;
      }`,fragmentShader:`
      uniform sampler2D pointTexture;
      uniform float fade;
      varying vec3 vColor;
      void main() {
        float opacity = 1.0;
        if (fade == 1.0) {
          float d = distance(gl_PointCoord, vec2(0.5, 0.5));
          opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
        }
        gl_FragColor = vec4(vColor, opacity);

        #include <tonemapping_fragment>
	      #include <${D>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}let A=e=>new E.Vector3().setFromSpherical(new E.Spherical(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),I=i.forwardRef(({radius:e=100,depth:t=50,count:r=5e3,saturation:o=0,factor:a=4,fade:n=!1,speed:l=1},s)=>{let u=i.useRef(null),[c,m,f]=i.useMemo(()=>{let n=[],i=[],l=Array.from({length:r},()=>(.5+.5*Math.random())*a),s=new E.Color,u=e+t,c=t/r;for(let e=0;e<r;e++)u-=c*Math.random(),n.push(...A(u).toArray()),s.setHSL(e/r,o,.9),i.push(s.r,s.g,s.b);return[new Float32Array(n),new Float32Array(i),new Float32Array(l)]},[r,t,a,e,o]);(0,d.useFrame)(e=>u.current&&(u.current.uniforms.time.value=e.clock.elapsedTime*l));let[h]=i.useState(()=>new _);return i.createElement("points",{ref:s},i.createElement("bufferGeometry",null,i.createElement("bufferAttribute",{attach:"attributes-position",args:[c,3]}),i.createElement("bufferAttribute",{attach:"attributes-color",args:[m,3]}),i.createElement("bufferAttribute",{attach:"attributes-size",args:[f,1]})),i.createElement("primitive",{ref:u,object:h,attach:"material",blending:E.AdditiveBlending,"uniforms-fade-value":n,depthWrite:!1,transparent:!0,vertexColors:!0}))});var O=e.i(83402);(0,f.extend)({Water:C,Sky:P});let z=new h.Color(17510),G=new h.Color(517),k=new h.Color(0xb4cbd1),F=new h.Color,N=new h.Color,U=function({lite:e=!1}){let{nightMode:t,setNightMode:r}=(0,p.useOcearoContext)(),{getWindData:o,getCurrentWeather:a}=(0,T.useWeather)(),l=(0,i.useRef)(),s=(0,i.useRef)(),u=(0,i.useRef)(),c=(0,i.useRef)(),m=(0,i.useRef)(null),f=(0,v.useSignalKPath)("navigation.position"),g=(0,i.useRef)(null);(0,i.useEffect)(()=>{g.current=f},[f]);let x=(0,i.useRef)(0),y=(0,i.useRef)(1),b=(0,M.useThree)(e=>e.gl),S=(0,M.useThree)(e=>e.scene),P=(0,i.useMemo)(()=>new h.Vector3,[]),j=R("assets/moon.jpg"),E=(0,w.useLoader)(h.TextureLoader,"assets/waternormals.jpg");(0,i.useMemo)(()=>{E.wrapS=E.wrapT=h.RepeatWrapping},[E]);let D=(0,i.useMemo)(()=>new h.PlaneGeometry(4e3,4e3,144,144),[]),_=(0,i.useMemo)(()=>new h.MeshBasicMaterial({color:0xb4cbd1}),[]),A=(0,i.useRef)({waveAmp:{value:0},waveTime:{value:0}}),U=(0,i.useRef)(),L=(0,i.useRef)(),V=(0,i.useRef)(!1),B=(0,i.useMemo)(()=>{let e=document.createElement("canvas");e.width=e.height=128;let t=e.getContext("2d"),r=t.createRadialGradient(64,64,8,64,64,62);return r.addColorStop(0,"rgba(255,255,255,0.85)"),r.addColorStop(.55,"rgba(255,255,255,0.35)"),r.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=r,t.fillRect(0,0,128,128),new h.CanvasTexture(e)},[]),W=(0,i.useMemo)(()=>{let e=[];for(let t=0;t<16;t++){let r=t/16*Math.PI*2+.6*Math.random(),o=500+1200*Math.random();e.push({position:[Math.cos(r)*o,260+180*Math.random(),Math.sin(r)*o],scale:[420+380*Math.random(),150+120*Math.random(),1]})}return e},[]),$=(0,i.useMemo)(()=>new h.SpriteMaterial({map:B,transparent:!0,opacity:0,depthWrite:!1,color:0xffffff}),[B]),H=(0,i.useMemo)(()=>{let e=new Float32Array(3600);for(let t=0;t<1200;t++)e[3*t]=(2*Math.random()-1)*240,e[3*t+1]=220*Math.random(),e[3*t+2]=(2*Math.random()-1)*240;let t=new h.BufferGeometry;return t.setAttribute("position",new h.BufferAttribute(e,3)),t},[]),Z=(0,i.useMemo)(()=>new h.PointsMaterial({color:0x9fc4d8,size:1.6,transparent:!0,opacity:.55,depthWrite:!1,sizeAttenuation:!0}),[]),K=(0,i.useMemo)(()=>({textureWidth:256,textureHeight:256,waterNormals:E,sunDirection:new h.Vector3,sunColor:0xffffff,waterColor:7695,distortionScale:3.7,fog:void 0!==S.fog,format:b.outputColorSpace}),[E,b.outputColorSpace,S.fog]),Y=(0,i.useMemo)(()=>{if(e)return null;let t=new C(D,K),r=A.current;return t.material.onBeforeCompile=e=>{e.uniforms.waveAmp=r.waveAmp,e.uniforms.waveTime=r.waveTime,e.vertexShader=e.vertexShader.replace("void main() {",`
          uniform float waveAmp;
          uniform float waveTime;
          vec3 swellDisplace(vec3 p) {
            float fade = 1.0 - smoothstep(1500.0, 1900.0, max(abs(p.x), abs(p.y)));
            float w1 = sin(p.x * 0.076 + p.y * 0.048 + waveTime * 1.15);
            float w2 = sin(p.x * 0.041 - p.y * 0.052 + waveTime * 0.85);
            float w3 = sin(-p.x * 0.022 + p.y * 0.030 + waveTime * 0.55);
            p.z += waveAmp * fade * (0.55 * w1 + 0.30 * w2 + 0.15 * w3);
            return p;
          }
          void main() {
            vec3 wavePos = swellDisplace(position);
        `).replace(/vec4\( position, 1.0 \)/g,"vec4( wavePos, 1.0 )")},t},[D,K,e]);return(0,d.useFrame)((r,n)=>{if(l.current&&(l.current.material.uniforms.time.value+=.5*n),A.current.waveTime.value+=n,U.current&&U.current.visible&&(U.current.rotation.y+=.004*n),L.current&&V.current){let e=L.current.geometry.attributes.position,t=e.array,r=160*n;for(let e=1;e<t.length;e+=3)t[e]-=r,t[e]<0&&(t[e]+=220);e.needsUpdate=!0}if(y.current+=n,y.current<1)return;let i=y.current;y.current=0;let d=g.current,f=d&&"number"==typeof d.latitude?d.latitude:46.15,p=d&&"number"==typeof d.longitude?d.longitude:-1.15,v=new Date,M=O.default.get("debugMode"),w=v;if(M){null===m.current&&(m.current=Date.now());let e=(Date.now()-m.current)/1e3*720%86400,t=Math.floor(e/3600),r=Math.floor(e%3600/60),o=new Date(v.getTime());o.setHours(t,r,0,0),w=o}let b=new Date(w.getFullYear(),0,0),C=w-b+(b.getTimezoneOffset()-w.getTimezoneOffset())*6e4,S=Math.PI/180,T=180/Math.PI,j=w.getHours(),R=w.getMinutes(),E=2*Math.PI/365*(C/864e5-1+(j-12)/24),D=229.18*(75e-6+.001868*Math.cos(E)-.032077*Math.sin(E)-.014615*Math.cos(2*E)-.040849*Math.sin(2*E)),I=.006918-.399912*Math.cos(E)+.070257*Math.sin(E)-.006758*Math.cos(2*E)+907e-6*Math.sin(2*E)-.002697*Math.cos(3*E)+.00148*Math.sin(3*E),B=((60*j+R+(D+4*p- -w.getTimezoneOffset())+1440)%1440/4-180)*S,W=f*S,H=90-Math.acos(Math.min(Math.max(Math.sin(W)*Math.sin(I)+Math.cos(W)*Math.cos(I)*Math.cos(B),-1),1))*T,K=(Math.atan2(Math.sin(B),Math.cos(B)*Math.sin(W)-Math.tan(I)*Math.cos(W))*T+360)%360,Y=0;Y=H<=-10?1:H>=5?0:(5-H)/15;let X=t||H<=-5,Q=X?Math.max(H,20):Math.max(H,5),q=h.MathUtils.degToRad(90-Q),J=h.MathUtils.degToRad(K);if(P.setFromSphericalCoords(1,q,J),l.current){let e=o()?.speed??5;x.current+=(e-x.current)*Math.min(.5*i,1);let t=Math.min(Math.max(.5*x.current,0),8),r=l.current.material.uniforms;r.distortionScale.value=t,r.sunDirection.value.copy(P).normalize();let a=O.default.get("aisLengthScalingFactor")||.7,n=Math.min(.21*x.current**2/9.81,6);A.current.waveAmp.value=n/2*a,F.copy(z).lerp(G,Y),r.sunColor.value.setHex(X?4491519:0xffffff),r.waterColor.value.copy(F)}e&&(F.copy(k).lerp(G,Y),_.color.copy(F));let ee=a(),et=Math.min(Math.max(ee?.cloudCover??0,0),1),er=Math.max(ee?.rain??0,0),eo=er>.05;if(U.current){U.current.visible=et>.08;let e=(1-.7*Y)*(eo?.55:1);N.setScalar(e),$.color.copy(N),$.opacity=.15+.55*et}if(V.current=eo,L.current&&(L.current.visible=eo,Z.opacity=Math.min(.3+.15*er,.75)),s.current){let t=s.current.material.uniforms,r=.5+.5*(ee?.humidity??.6)+9*et+4*!!eo,o={turbidity:e?Math.min(r,2.5):r,rayleigh:1.2*(1-.5*et),mieCoefficient:.005+.02*et,mieDirectionalG:.8},a={turbidity:.05,rayleigh:.1,mieCoefficient:5e-4,mieDirectionalG:.95},n=e=>o[e]+(a[e]-o[e])*Y;t.turbidity.value=n("turbidity"),t.rayleigh.value=n("rayleigh"),t.mieCoefficient.value=n("mieCoefficient"),t.mieDirectionalG.value=n("mieDirectionalG"),t.sunPosition.value.copy(P)}c.current&&(c.current.position.copy(P).multiplyScalar(4e3),c.current.visible=!X),u.current&&(u.current.position.copy(P).multiplyScalar(4e3),u.current.visible=X,u.current.lookAt(0,0,0))}),(0,i.useEffect)(()=>{let e=new h.Color(t?517:6694);return S.background=e,S.fog=new h.FogExp2(e,35e-5),b.outputColorSpace=h.SRGBColorSpace,()=>{S.background=null,S.fog=null}},[S,t,b]),(0,n.jsxs)(n.Fragment,{children:[t&&(0,n.jsx)(I,{radius:5e3,depth:50,count:1500,factor:4,saturation:0,fade:!0,speed:1}),(0,n.jsx)("sky",{ref:s,scale:45e4}),t&&(0,n.jsxs)("mesh",{ref:u,position:[600,200,-1500],children:[(0,n.jsx)("sphereGeometry",{args:[80,32,32]}),(0,n.jsx)("meshStandardMaterial",{map:j,emissive:0xffffff,emissiveIntensity:.8})]}),(0,n.jsxs)("mesh",{ref:c,children:[(0,n.jsx)("sphereGeometry",{args:[200,32,32]}),(0,n.jsx)("meshBasicMaterial",{color:0xffffff})]}),(0,n.jsx)("group",{ref:U,visible:!1,children:W.map((e,t)=>(0,n.jsx)("sprite",{position:e.position,scale:e.scale,material:$},t))}),(0,n.jsx)("points",{ref:L,geometry:H,material:Z,visible:!1}),e?(0,n.jsx)("mesh",{geometry:D,material:_,"rotation-x":-Math.PI/2,position:[0,-.3,0]}):(0,n.jsx)("primitive",{ref:l,object:Y,"rotation-x":-Math.PI/2,position:[0,-.3,0]})]})},L="https://tile.openstreetmap.org/{z}/{x}/{y}.png",V="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",B="https://tiles.windy.com/tiles/v10.0/wind/{z}/{x}/{y}.png",W="saturate(1.8) contrast(1.35)",$="brightness(0.72) saturate(1.15) contrast(1.05)";function H(e,t,r,o){return e.replace("{z}",t).replace("{x}",r).replace("{y}",o)}function Z(e,t){return 156543.03*Math.cos(e*Math.PI/180)/Math.pow(2,t)}let K=new Map;function Y(e){if(K.has(e))return K.get(e);let t=new Promise(t=>{let r=new Image;r.crossOrigin="anonymous",r.onload=()=>t(r),r.onerror=()=>t(null),r.src=e});return K.set(e,t),t}async function X(e,t,r,o){let a=await Y(H(e,t,r,o));if(a)return{img:a,sx:0,sy:0,sSize:256};for(let n=1;n<=3&&t-n>=1;n++){let i=t-n,l=r>>n,s=o>>n;if(a=await Y(H(e,i,l,s))){let e=256/Math.pow(2,n);return{img:a,sx:(r-(l<<n))*e,sy:(o-(s<<n))*e,sSize:e}}}return null}async function Q(e,t,r,o,a=1,n="none"){let i,{latitude:l,longitude:s}=t,u=256*a;e.filter=n;let c=(s+180)/360*Math.pow(2,r),m=(1-Math.log(Math.tan(i=l*Math.PI/180)+1/Math.cos(i))/Math.PI)/2*Math.pow(2,r),d=c*u-512,f=m*u-512,h=Math.floor(d/u),p=Math.floor(f/u),v=Math.ceil(1024/u)+2,g=Math.pow(2,r),x=[];for(let e=0;e<v;e++)for(let t=0;t<v;t++){let o=h+t,a=p+e;if(a<0||a>=g)continue;let n=(o%g+g)%g,i=Math.round(o*u-d),l=Math.round(a*u-f);x.push({z:r,x:n,y:a,screenLeft:i,screenTop:l})}let M=await Promise.all(x.map(e=>X(o,e.z,e.x,e.y)));for(let t=0;t<x.length;t++){let r=M[t];if(!r)continue;let{screenLeft:o,screenTop:a}=x[t];e.drawImage(r.img,r.sx,r.sy,r.sSize,r.sSize,o,a,u,u)}e.filter="none"}async function q(e,t,r,o){let a=e.getContext("2d");for(let e of(a.clearRect(0,0,1024,1024),o)){if(!e?.template)continue;let o=Math.min(r,e.maxZoom??r),n=Math.pow(2,r-o);await Q(a,t,o,e.template,n,e.filter||"none")}}function J({mode:e="chart"}){let t=(0,i.useRef)(),r=(0,i.useRef)(null),o=(0,i.useRef)(null),a=(0,i.useRef)(!1),l=(0,i.useRef)({position:null,zoom:null}),s=(0,i.useRef)(0),u=(0,i.useRef)("meteo"===e?[{template:L,maxZoom:19,filter:$},{template:B,maxZoom:11,filter:W}]:[{template:L,maxZoom:19,filter:$},{template:V,maxZoom:18}]),{gl:c}=(0,M.useThree)(),m=O.default.get("aisLengthScalingFactor")||.7,[f,p]=(0,i.useState)(16),[g,x]=(0,i.useState)(500),w=(0,v.useSignalKPath)("navigation.position"),y=(0,i.useRef)(null);(0,i.useEffect)(()=>{y.current=w},[w]);let b=w?.latitude!=null&&w?.longitude!=null;(0,d.useFrame)(({camera:t})=>{if(s.current++,s.current%15!=0)return;let r=y.current;if(r?.latitude==null)return;let o=Math.min(Math.max(4*(t.position.length()/m),"meteo"===e?4e4:500),6e4),a=Math.max(3,Math.min("meteo"===e?11:u.current[0]?.template===L?19:18,Math.round(Math.log2(156543.03*Math.cos(r.latitude*Math.PI/180)/(o/1024)))));a!==f&&p(a)});let C=(0,i.useCallback)((e=!1)=>{if(a.current)return;let t=y.current;if(t?.latitude==null||t?.longitude==null)return;let n=l.current;if(!e&&n.position&&n.zoom===f){let e=48*Z(t.latitude,f)/111320,r=Math.abs(t.latitude-n.position.latitude),o=Math.abs(t.longitude-n.position.longitude);if(r<e&&o<e)return}let i=r.current,s=o.current;i&&s&&(a.current=!0,l.current={position:t,zoom:f},x(1024*Z(t.latitude,f)/2*m),q(i,t,f,u.current).then(()=>{s.needsUpdate=!0,a.current=!1}))},[f,m]);(0,i.useEffect)(()=>{let e=document.createElement("canvas");e.width=1024,e.height=1024,r.current=e;let a=new h.CanvasTexture(e);return a.minFilter=h.LinearMipmapLinearFilter,a.magFilter=h.LinearFilter,a.anisotropy=c.capabilities.getMaxAnisotropy(),a.generateMipmaps=!0,o.current=a,t.current&&(t.current.material.map=a,t.current.material.needsUpdate=!0),()=>{a.dispose()}},[c]),(0,i.useEffect)(()=>{if("meteo"===e){u.current=[{template:L,maxZoom:19,filter:$},{template:B,maxZoom:11,filter:W}],C(!0),fetch("https://api.rainviewer.com/public/weather-maps.json").then(e=>e.json()).then(e=>{let t=e?.radar?.past,r=t?.[t.length-1]?.path;r&&(u.current=[...u.current,{template:`https://tilecache.rainviewer.com${r}/256/{z}/{x}/{y}/2/1_1.png`,maxZoom:12}],C(!0))}).catch(()=>{});return}let t=O.default.getAll().signalkUrl||"http://localhost:3000";fetch(`${t}/signalk/v1/api/resources/charts`).then(e=>e.json()).then(e=>{if(!e||"object"!=typeof e)return;let t=Object.values(e),r=t.find(e=>"openstreetmap"!==e.identifier&&e.tilemapUrl)||t.find(e=>e.tilemapUrl);r?.tilemapUrl&&(u.current=[{template:r.tilemapUrl.includes("{z}")?r.tilemapUrl:`${r.tilemapUrl}/{z}/{x}/{y}.png`,maxZoom:18}]),C(!0)}).catch(()=>{u.current=[{template:L,maxZoom:19,filter:$},{template:V,maxZoom:18}],C(!0)})},[e,C]),(0,i.useEffect)(()=>{C()},[w,e,f]),(0,i.useEffect)(()=>{t.current&&o.current&&(t.current.material.map=o.current,t.current.material.needsUpdate=!0)});let S=(0,i.useMemo)(()=>new h.PlaneGeometry(2*g,2*g),[g]),P=(0,i.useMemo)(()=>new h.MeshBasicMaterial({side:h.DoubleSide,transparent:!1}),[]);return b?(0,n.jsx)("mesh",{ref:t,geometry:S,material:P,rotation:[-Math.PI/2,0,0],position:[0,-.1,0]}):null}var ee=e.i(46991),et=e.i(62588),er=e.i(47167),eo=e.i(78140);let ea=er.default.env.ASSET_PREFIX||"./",en={},ei={30:.1,31:.14,36:.23,37:.07,50:.03,70:.1,80:.12},el=`${ea}/draco/`;function es({code:e,scaleFactor:t}){let{scene:r}=(0,eo.useGLTF)(`${ea}/boats/ais/ais-${e}.glb`,el),o=(0,i.useMemo)(()=>{let t=r.clone(!0);t.traverse(e=>{e.isMesh&&(e.material=new h.MeshStandardMaterial({color:0xeef2f5,roughness:.7,metalness:.1}),e.castShadow=!1,e.receiveShadow=!1)});let o=new h.Box3().setFromObject(t),a=new h.Vector3,n=new h.Vector3;o.getSize(a),o.getCenter(n);let i=a.x>=a.z,l=Math.max(a.x,a.z)||1,s=l*(ei[e]??.06);t.position.set(-n.x,-o.min.y-s,-n.z);let u=new h.Group;return u.add(t),u.scale.setScalar(10/l),u.rotation.y=(i?Math.PI/2:0)+(en[e]||0),u},[r,e]);return(0,n.jsx)("group",{scale:t,children:(0,n.jsx)("primitive",{object:o})})}let eu=({position:e,visible:t,boatData:r,onClick:o,ref:a})=>{let l,s=Number.isFinite(l=Number(r.shipType))?30===l?30:l>=31&&l<=32?31:l>=33&&l<=35?35:36===l?36:37===l?37:l>=40&&l<=49?40:l>=50&&l<=59?50:l>=60&&l<=69?60:l>=70&&l<=79?70:l>=80&&l<=89?80:70:70,u=Math.max(r.length||10,4);return(0,n.jsx)("group",{ref:a,position:e,visible:t,onClick:e=>{e.stopPropagation(),o&&o(r)},children:(0,n.jsx)(i.Suspense,{fallback:null,children:(0,n.jsx)(es,{code:s,scaleFactor:.7*u/10})})})},ec=new h.Vector3,em=new h.Quaternion,ed=new h.Quaternion,ef=new h.Euler,eh=e=>{if(e.isMesh&&e.material)return e;if(e.children?.length)for(let t of e.children){let e=eh(t);if(e)return e}return null},ep=({onUpdateInfoPanel:e})=>{let{aisData:t,vesselIds:r}=(0,et.useAIS)(),o=(0,i.useRef)({}),a=(0,i.useRef)({}),l=(0,i.useRef)({}),[s,u]=(0,i.useState)(null),c=(0,i.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),m=(0,v.useSignalKPaths)(c),f=(0,i.useMemo)(()=>{let e=m["navigation.headingTrue"]||m["navigation.headingMagnetic"],t=m["navigation.courseOverGroundTrue"]||m["navigation.courseOverGroundMagnetic"];return e||t||0},[m]),h=(0,i.useRef)(0);(0,i.useEffect)(()=>{h.current=f},[f]),(0,d.useFrame)(()=>{t&&0!==Object.keys(o.current).length&&Object.entries(o.current).forEach(([e,r])=>{if(!r)return;let o=t[e];if(!o){r.visible=!1;return}if(((e,t,r=!0)=>{let o=-t.rotationAngleY;r?(ec.set(t.sceneX,e.position.y,t.sceneZ),e.position.lerp(ec,.1),em.setFromEuler(e.rotation),ef.set(0,o,0),ed.setFromEuler(ef),em.slerp(ed,.1),e.rotation.setFromQuaternion(em)):(e.position.set(t.sceneX,0,t.sceneZ),e.rotation.set(0,o,0))})(r,o,!0),r.visible=o.visible,r.visible){let t=l.current[e];if(!t){if(!(t=eh(r)))return;l.current[e]=t}if(!a.current[e]){let r=t.material;if(!r)return;a.current[e]={white:r.clone(),red:r.clone(),originalColor:r.color.clone()},a.current[e].white.color.copy(a.current[e].originalColor),a.current[e].red.color.set(p.oRed)}let n=a.current[e],i=r.userData.proximityColor||"white",s=i;"red"===i&&o.distanceMeters>550?s="white":"white"===i&&o.distanceMeters<500&&(s="red"),s!==i?(t.material="red"===s?n.red:n.white,r.userData.proximityColor=s):t.material&&(t.material===n.red||t.material===n.white)||(t.material="red"===i?n.red:n.white)}})});let g=(0,i.useCallback)(e=>{e&&u(t=>t&&t.mmsi===e.mmsi?null:e)},[]),x=(0,i.useMemo)(()=>r.filter(Boolean).slice().sort((e,t)=>(e.distanceMeters??1/0)-(t.distanceMeters??1/0)).slice(0,50).map(e=>(0,n.jsx)(eu,{ref:t=>{t?(t.userData={...t.userData,mmsi:e.mmsi},o.current[e.mmsi]=t):(delete o.current[e.mmsi],delete a.current[e.mmsi],delete l.current[e.mmsi])},rotation:[0,-e.rotationAngleY,0],position:[e.sceneX,0,e.sceneZ],visible:e.visible,boatData:e,onClick:g},e.mmsi)),[r,g]),M=(e,t,r="",o=!1,a=!1)=>null==t||""===t||"string"==typeof t&&0===t.trim().length?null:(o&&null!==t&&(t=(0,ee.toDegrees)(t)),a&&null!==t&&(t=(0,ee.toKnots)(t)),`${e}: ${t}${r}`),w=s?[M("Vessel",s.name),M("MMSI",(e=>{if(!e)return null;let t=String(e);for(let e of["urn:mrn:imo:mmsi:","urn:mrn:signalk:uuid:"])if(t.startsWith(e)){t=t.substring(e.length);break}return t})(s.mmsi)),M("RNG",s.distanceMeters?s.distanceMeters.toFixed(0):0," m"),M("LOA",s.length," m"),M("Type",s.shipType),M("SOG",s.sog," kn",!1,!0),M("COG",s.cog,"°",!0),M("HDG",s.heading,"°",!0),M("Beam",s.beam," m"),M("Draft",s.draft," m"),M("Call",s.callsign),M("Dest",s.destination)].filter(e=>null!==e).join("\n"):"";return(0,i.useEffect)(()=>{e&&e(w)},[w,e]),(0,n.jsx)(n.Fragment,{children:(0,n.jsx)("group",{rotation:[0,h.current,0],children:x})})};var ev=e.i(31067);function eg(e,t){let r=e+"Geometry";return i.forwardRef(({args:e,children:o,...a},n)=>{let l=i.useRef(null);return i.useImperativeHandle(n,()=>l.current),i.useLayoutEffect(()=>void(null==t||t(l.current))),i.createElement("mesh",(0,ev.default)({ref:l},a),i.createElement(r,{attach:"geometry",args:e}),o)})}let ex=eg("sphere"),eM=eg("ring");var ew=e.i(16196);let ey=i.default.memo(({radius:e,isOuter:t,markerColorPrimary:r,markerColorGreen:o,markerColorRed:a})=>{let l=(0,i.useMemo)(()=>{let i=[];for(let l=0;l<360;l+=10){let s=h.MathUtils.degToRad(l-90),u=l%30==0,c=t?u?.35:.15:u?.25:.1,m=(e+.5*c+.2)*Math.cos(s),d=(e+.5*c+.2)*Math.sin(s),f=t&&l>0&&l<61,p=t&&l>=300&&l<360,v=f?o:p?a:r;if(!t&&u){let e;e=0===l?"N":90===l?"E":180===l?"S":270===l?"W":l.toString(),i.push((0,n.jsx)(ew.Text,{characters:"NESW0123456789",position:[m,.02,d],color:r,fontSize:.6,rotation:[-Math.PI/2,0,Math.PI/2-s],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e},`text-${l}`))}else i.push((0,n.jsx)(ex,{args:[c/2,16,16],position:[m,0,d],children:(0,n.jsx)("meshBasicMaterial",{color:v,transparent:!0,opacity:u?.8:.4})},`marker-${t?"outer":"inner"}-${l}`))}return i},[e,t,r,o,a]);return(0,n.jsx)(n.Fragment,{children:l})});ey.displayName="StaticMarkers";let eb=i.default.memo(({innerRadius:e,outerRadius:t,dialColor:r,opacity:o=1,transparent:a=!1})=>(0,n.jsx)(eM,{args:[e,t,64],rotation:[Math.PI/2,0,0],children:(0,n.jsx)("meshBasicMaterial",{color:r,side:h.DoubleSide,transparent:a,opacity:o,depthWrite:!1})}));eb.displayName="StaticRing";let eC=({outerRadius:e,innerRadius:t})=>{let{nightMode:r}=(0,p.useOcearoContext)(),o=r?p.oNight:"#ffffff",a=p.oGreen,l=p.oRed,s=(0,i.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),u=(0,v.useSignalKPaths)(s),c=(0,i.useMemo)(()=>{let e=O.default.get("preferredHeadingPath")||"courseOverGroundTrue",t=u[`navigation.${e}`];if(null!=t)return t;let r=u["navigation.headingTrue"]||u["navigation.headingMagnetic"];return u["navigation.courseOverGroundTrue"]||u["navigation.courseOverGroundMagnetic"]||r||0},[u]),m=r?"#000000":"#0a0a0a",d=O.default.get("compassNorthUp"),f=(0,i.useMemo)(()=>({innerRadius:t,outerRadius:e,dialColor:m,markerColorPrimary:o,markerColorGreen:a,markerColorRed:l}),[t,e,m,o,a,l]);return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)("group",{rotation:[0,c+(d?0:Math.PI),0],children:[(0,n.jsx)(eb,{innerRadius:f.innerRadius,outerRadius:f.outerRadius,dialColor:f.dialColor,transparent:!0,opacity:.1}),(0,n.jsx)(ey,{radius:f.innerRadius,isOuter:!1,markerColorPrimary:f.markerColorPrimary,markerColorGreen:f.markerColorGreen,markerColorRed:f.markerColorRed})]}),(0,n.jsxs)("group",{children:[(0,n.jsx)(eb,{innerRadius:f.innerRadius+.8,outerRadius:f.outerRadius+.8,dialColor:f.dialColor,transparent:!0,opacity:.15}),(0,n.jsx)(ey,{radius:f.innerRadius+.8,isOuter:!0,markerColorPrimary:f.markerColorPrimary,markerColorGreen:f.markerColorGreen,markerColorRed:f.markerColorRed})]})]})};eC.displayName="CompassDial";var eS=e.i(84226);let eP=({visible:e=!0,position:t,scale:r})=>!e||O.default.get("hide3DCompass")?null:(0,n.jsxs)("group",{position:t,scale:r,children:[(0,n.jsx)(eC,{outerRadius:5.6,innerRadius:5}),(0,n.jsx)(eS.default,{outerRadius:5.6+1.1})]});var eT=e.i(66799);let ej=({start:e,end:t,color:r,width:o=.2,height:a=.1,dashed:l=!1})=>{let s=(0,i.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?new h.Vector3().addVectors(e,t).multiplyScalar(.5):new h.Vector3,[e,t]),u=(0,i.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?new h.Vector3().subVectors(t,e).normalize():new h.Vector3(0,0,1),[e,t]),c=(0,i.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?e.distanceTo(t):0,[e,t]),m=(0,i.useMemo)(()=>[0,Math.atan2(u.x,u.z),0],[u]);if(!e||!t||!e.isVector3||!t.isVector3)return null;if(l){let t=Math.floor(c/.7);if(t<=0)return null;let i=[];for(let l=0;l<t;l++){let t=.7*l,s=new h.Vector3().copy(e).add(new h.Vector3().copy(u).multiplyScalar(t+.2));i.push((0,n.jsxs)("mesh",{position:s.toArray(),rotation:m,scale:[o,a,.4],children:[(0,n.jsx)("boxGeometry",{}),(0,n.jsx)("meshStandardMaterial",{color:r})]},l))}return(0,n.jsx)(n.Fragment,{children:i})}return(0,n.jsxs)("mesh",{position:s.toArray(),rotation:m,scale:[o,a,c],children:[(0,n.jsx)("boxGeometry",{}),(0,n.jsx)("meshBasicMaterial",{color:r,transparent:!0,opacity:.6,depthWrite:!1})]})},eR=({outerRadius:e=10})=>{let{convertLatLonToXY:t}=(0,p.useOcearoContext)(),r=O.default.get("debugMode"),o=(0,i.useMemo)(()=>["navigation.courseGreatCircle.nextPoint.bearingTrue","navigation.courseGreatCircle.nextPoint.distance","navigation.position"],[]),a=(0,v.useSignalKPaths)(o),[l,s]=(0,i.useState)([]),[u,c]=(0,i.useState)(null);(0,i.useEffect)(()=>{if(r)return;let e=async()=>{try{let e=await eT.default.getWaypoints();if(e){let t=Object.entries(e).map(([e,t])=>{let r=eT.default.parseWaypointPosition(t);return{id:e,name:t.name||"Waypoint",...r}}).filter(e=>e.latitude&&e.longitude);s(t)}let t=await eT.default.getCourse();c(t)}catch(e){console.warn("LayLines3D: Could not fetch navigation data:",e.message)}};e();let t=setInterval(e,3e4);return()=>clearInterval(t)},[r]);let m=a["navigation.courseGreatCircle.nextPoint.bearingTrue"]??h.MathUtils.degToRad(30),d=a["navigation.courseGreatCircle.nextPoint.distance"]??20,f=a["navigation.position"],g=(0,i.useMemo)(()=>new h.Vector3(0,0,0),[]),x=(0,i.useMemo)(()=>{if(r)return new h.Vector3(3,0,-5);if(u?.nextPoint?.position){let e=u.nextPoint.position;if(f?.latitude&&f?.longitude&&e.latitude&&e.longitude){let{x:r,y:o}=t({lat:e.latitude,lon:e.longitude},{lat:f.latitude,lon:f.longitude});return new h.Vector3(.01*r,0,-(.01*o))}}return void 0!==m&&void 0!==d?function(e,t,r=1){return new h.Vector3(e*Math.sin(t)*r,0,-e*Math.cos(t)*r)}(Math.min(.001*d,2*e),m,1):new h.Vector3(0,0,-5)},[r,u,f,m,d,t,e]),M=(0,i.useMemo)(()=>{let e=x.x,t=x.z;return{port:new h.Vector3(0,0,t),starboard:new h.Vector3(e,0,0)}},[x]);return(0,n.jsx)("group",{children:(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(ex,{position:x.toArray(),args:[.5,16,16],"material-color":p.oYellow,children:[(0,n.jsxs)("mesh",{position:[0,0,0],rotation:[0,Math.PI/2,0],children:[(0,n.jsx)("cylinderGeometry",{args:[.05,.05,1,8]}),(0,n.jsx)("meshStandardMaterial",{color:"black"})]}),(0,n.jsxs)("mesh",{position:[0,0,0],rotation:[Math.PI/2,0,0],children:[(0,n.jsx)("cylinderGeometry",{args:[.05,.05,1,8]}),(0,n.jsx)("meshStandardMaterial",{color:"black"})]})]}),(0,n.jsx)(ej,{start:g,end:M.port,color:p.oGreen,width:.2,height:.1}),(0,n.jsx)(ej,{start:M.port,end:x,color:p.oGreen,width:.2,height:.1}),(0,n.jsx)(ej,{start:g,end:M.starboard,color:p.oRed,width:.2,height:.1}),(0,n.jsx)(ej,{start:M.starboard,end:x,color:p.oRed,width:.2,height:.1})]})})};var eE=e.i(43216),eD=e.i(74452);let e_={DEG2RAD:Math.PI/180,ROTATION_INTERPOLATION_FACTOR:.05,SOG_SMOOTHING_FACTOR:.1,DEFAULT_SOG:3,ANGLE_INCREMENT:10,SPHERE_SIZE:.4,SPHERE_SEGMENTS:32,PLOTS_COUNT:5,FRAME_TO_MINUTE_RATIO:3600},eA=(e,t)=>.44704*e*60*t*.1,eI=(e,t,r)=>{if(!e||!t)return new h.Vector3(0,0,0);let o=e*e_.DEG2RAD,a=eA(t,r);return new h.Vector3(a*Math.sin(o),0,-a*Math.cos(o))},eO=({position:e,color:t})=>e?(0,n.jsxs)("mesh",{position:e,children:[(0,n.jsx)("sphereGeometry",{args:[e_.SPHERE_SIZE,e_.SPHERE_SEGMENTS,e_.SPHERE_SEGMENTS]}),(0,n.jsx)("meshBasicMaterial",{color:t,transparent:!0,opacity:.8})]}):null,ez=({points:e,color:t})=>e?.length?(0,n.jsx)(eE.Line,{points:e,color:t,lineWidth:2,transparent:!0,opacity:.5}):null,eG=i.default.memo(({timeInMinute:e,windSpeed:t})=>{let r=(0,i.useRef)(eD.default.vpp),o=(0,i.useCallback)((e,t,r,o)=>{if(!e?.length||!t?.length||e.length<=r||t.length<=r)return console.warn("Invalid angle or VMG data"),null;let a=e[r],n=t[r],i=a*e_.DEG2RAD,l=eA(n,o);return new h.Vector3(l*Math.sin(i),0,-l*Math.cos(i))},[]),a=(0,i.useCallback)((e,t)=>{let{speeds:o,angles:a,beat_angle:n,beat_vmg:i,run_angle:l,run_vmg:s}=r.current;if(!o?.length||!a?.length)return console.warn("Invalid polar data"),null;let u=[],c=(e,r,o)=>{for(let a=e;a<=r;a+=e_.ANGLE_INCREMENT)u.push(eI(a,o(a),t))};c(0,n[e]-e_.ANGLE_INCREMENT,t=>{let r;return r=i[e],0+t/n[e]*(r-0)});let m=eI(n[e],i[e],t);u.push(m),a.forEach(o=>{if(o>n[e]&&o<l[e]){let a=r.current[Math.floor(o)]?.[e]||0;u.push(eI(o,a,t))}});let d=eI(l[e],s[e],t);return u.push(d),c(l[e]+e_.ANGLE_INCREMENT,180,()=>s[e]),new h.CatmullRomCurve3(u,!0)},[]),l=(0,i.useMemo)(()=>{let n=r.current;if(!n?.speeds?.length)return console.warn("Invalid polar data structure"),{curve:null,beat:null,run:null};let i=((e,t)=>{if(!e?.length)return 0;let r=0,o=e.length-1;for(;r<o;){let a=Math.floor((r+o)/2);e[a]<t?r=a+1:o=a}return r})(n.speeds,t);return{curve:a(i,e),beat:o(n.beat_angle,n.beat_vmg,i,e),run:o(n.run_angle,n.run_vmg,i,e)}},[e,t,o,a]),s=[0,-Math.PI];return(0,n.jsx)(n.Fragment,{children:s.map((e,t)=>(0,n.jsxs)("group",{position:[0,-.7,0],rotation:[0,0,e],children:[l.curve&&(0,n.jsx)(ez,{points:l.curve.getPoints(100),color:p.oBlue}),(0,n.jsx)(eO,{position:l.beat,color:p.oGreen}),(0,n.jsx)(eO,{position:l.run,color:p.oRed})]},t))})});eG.displayName="PolarPlot";let ek=function(){let e=(0,i.useRef)([]),[t,r]=(0,i.useState)([]),o=(0,i.useRef)(0),a=(0,i.useRef)([]),l=(0,i.useRef)(e_.DEFAULT_SOG),s=O.default.get("preferredWindSpeedPath")||"speedTrue",u=O.default.get("preferredWindDirectionPath")||"angleTrueWater",c=(0,i.useMemo)(()=>[`environment.wind.${u}`,`environment.wind.${s}`,"environment.wind.angleTrueWater","environment.wind.angleTrueGround","environment.wind.speedTrue","environment.wind.speedOverGround","environment.wind.angleApparent","environment.wind.speedApparent","navigation.speedOverGround","navigation.headingTrue","navigation.courseOverGroundTrue"],[u,s]),m=(0,v.useSignalKPaths)(c),f=(0,i.useMemo)(()=>{let e=m["environment.wind.angleApparent"],t=m["environment.wind.speedApparent"];if(null!=e&&null!=t&&t>0)return-e;if("directionTrue"===u){let e=m["environment.wind.directionTrue"];if(null!=e)return-(e-(m["navigation.headingTrue"]??m["navigation.courseOverGroundTrue"]??0));let t=m["environment.wind.angleTrueGround"]??m["environment.wind.angleTrueWater"];return null!=t?-t:0}let r=m[`environment.wind.${u}`]??m["environment.wind.angleTrueWater"]??m["environment.wind.angleTrueGround"];return null!=r?-r:0},[m,u]),p=(0,i.useMemo)(()=>{let e=m[`environment.wind.${s}`]??m["environment.wind.speedTrue"]??m["environment.wind.speedOverGround"];return(0,ee.convertWindSpeed)(e)||0},[m,s]),g=m["navigation.speedOverGround"]||e_.DEFAULT_SOG,x=(0,i.useRef)(p),[M,w]=(0,i.useState)(Date.now()),y=(0,i.useRef)(null);return(0,i.useEffect)(()=>{let t=Array.from({length:e_.PLOTS_COUNT},(e,t)=>({id:t,timeInMinute:5*(t+1)}));return r(t),e.current=t.map(()=>new h.Group),a.current=Array(e_.PLOTS_COUNT).fill(0),y.current=setInterval(()=>{w(Date.now()),o.current=0},12e4),()=>{y.current&&clearInterval(y.current)}},[]),(0,i.useEffect)(()=>{Math.abs(x.current-p)>5&&(w(Date.now()),o.current=0,x.current=p)},[p]),(0,d.useFrame)(()=>{o.current+=1,l.current=h.MathUtils.lerp(l.current,g,e_.SOG_SMOOTHING_FACTOR),t.forEach((t,r)=>{let n=e.current[r];if(n&&t.timeInMinute-o.current/e_.FRAME_TO_MINUTE_RATIO>0){let e=a.current[r],t=h.MathUtils.lerp(e,f,e_.ROTATION_INTERPOLATION_FACTOR);n.rotation.set(0,t,0),a.current[r]=t}})}),(0,n.jsx)(n.Fragment,{children:t.map((t,r)=>(0,n.jsx)("group",{ref:t=>{t&&(e.current[r]=t)},children:(0,n.jsx)(eG,{timeInMinute:t.timeInMinute,windSpeed:p},`plot-${M}-${r}`)},`${t.id}-${M}`))})},eF=()=>{let{states:e,nightMode:t}=(0,p.useOcearoContext)(),r=t?.3:.5;return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("ambientLight",{intensity:t?.2:.4}),(0,n.jsx)("directionalLight",{position:[0,70,-100],intensity:t?.6:1.2,castShadow:!1,color:t?"#b0d8ff":"#ffffff"}),(0,n.jsx)("spotLight",{position:[0,50,100],intensity:2*r,angle:.6,penumbra:1,color:t?"#4080ff":"#ffffff"}),(0,n.jsx)("pointLight",{position:[0,40,-80],intensity:2.5*r,distance:150,decay:2}),(0,n.jsx)("pointLight",{position:[0,30,100],intensity:.8*r,distance:120,decay:2})]})},eN={mainCar:.5,jibCar:.5,tension:.5,reefLevel:0};var eU=e.i(5941);let eL="#333333",eV="#222222",eB=[{label:"GV",centerDeg:180,color:"#09bfff",key:"mainCar",mode:"position"},{label:"FP",centerDeg:260,color:"#15bd6f",key:"jibCar",side:"port",mode:"fill"},{label:"FS",centerDeg:100,color:"#bf1515",key:"jibCar",side:"starboard",mode:"fill"}];function eW(e,t){let r=h.MathUtils.degToRad(e-90);return[t*Math.cos(r),t*Math.sin(r)]}let e$=({label:e,value:t,centerDeg:r,color:o})=>{let a=Math.max(0,Math.min(1,t)),l=(0,i.useMemo)(()=>{let e=[],t=r-15;for(let r=0;r<=12;r++){let i=r/12,[l,s]=eW(t+30*i,4.2),u=Math.abs(i-a),c=u<=.041666666666666664,m=u<=.125,d=.041666666666666664>=Math.abs(i-.5),f=eL,h=.09,p=.3;c?(f=o,h=.16,p=1):m?(f=o,h=.09,p=.5):d&&(p=.5),e.push((0,n.jsx)(ex,{args:[h,8,8],position:[l,0,s],children:(0,n.jsx)("meshBasicMaterial",{color:f,transparent:!0,opacity:p})},r))}return e},[a,r,o]),s=h.MathUtils.degToRad(r-90),u=3.6*Math.cos(s),c=3.6*Math.sin(s);return(0,n.jsxs)("group",{children:[l,(0,n.jsx)(ew.Text,{position:[u,-.4,c],color:o,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-s],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e})]})},eH=({label:e,value:t,centerDeg:r,color:o,active:a})=>{let l=Math.max(0,Math.min(1,t)),s=(0,i.useMemo)(()=>{let e=[],t=r-15;for(let r=0;r<=12;r++){let i=r/12,[s,u]=eW(t+30*i,4.2),c=eV,m=.09,d=.15;if(a){let e=i<=l;.041666666666666664>=Math.abs(i-l)?(c=o,m=.16,d=1):e?(c=o,d=.7):(c=eL,d=.3)}e.push((0,n.jsx)(ex,{args:[m,8,8],position:[s,0,u],children:(0,n.jsx)("meshBasicMaterial",{color:c,transparent:!0,opacity:d})},r))}return e},[l,r,o,a]),u=h.MathUtils.degToRad(r-90),c=3.6*Math.cos(u),m=3.6*Math.sin(u);return(0,n.jsxs)("group",{children:[s,(0,n.jsx)(ew.Text,{position:[c,-.4,m],color:a?o:eV,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-u],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:a?.9:.2,children:e})]})},eZ=()=>{let e=(0,v.useSignalKPath)("environment.wind.angleApparent",0),t=(0,v.useSignalKPath)("environment.wind.speedApparent",0),r=(0,i.useMemo)(()=>{let t=e;for(;t<0;)t+=2*Math.PI;for(;t>=2*Math.PI;)t-=2*Math.PI;return t>Math.PI},[e]),{mainCar:o,jibCar:a}=(0,i.useMemo)(()=>(function(e,t){let r=e;for(;r<0;)r+=2*Math.PI;for(;r>=2*Math.PI;)r-=2*Math.PI;let o=r>Math.PI,a=Math.max(0,1-(o?2*Math.PI-r:r)/(.75*Math.PI)),n=Math.min(1,Math.abs(t)/15),i=(1-a)*.4*n;return{mainCar:o?.5-i:.5+i,jibCar:Math.max(.05,Math.min(1,(1-a)*.7+.2*n+.1))}})(e,t),[e,t]);return(0,n.jsx)("group",{children:eB.map(e=>{let t="mainCar"===e.key?o:a,i=!0;return("port"===e.side&&(i=!r),"starboard"===e.side&&(i=r),"position"===e.mode)?(0,n.jsx)(e$,{label:e.label,value:t,centerDeg:e.centerDeg,color:e.color},e.label):(0,n.jsx)(eH,{label:e.label,value:t,centerDeg:e.centerDeg,color:e.color,active:i},e.label)})})};e.s(["default",0,({onUpdateInfoPanel:e})=>{let{states:t}=(0,p.useOcearoContext)(),r=(0,i.useRef)(),o=O.default.get("debugShowAxes"),a=(()=>{let[e,t]=(0,i.useState)(eN),r=O.default.get("preferredWindSpeedPath")||"speedTrue",o=O.default.get("preferredWindDirectionPath")||"angleTrueWater",a=(0,i.useMemo)(()=>[`environment.wind.${r}`,`environment.wind.${o}`,"environment.wind.speedTrue","environment.wind.angleTrueWater","environment.wind.angleApparent","environment.wind.speedApparent"],[r,o]),n=(0,v.useSignalKPaths)(a),l=n[`environment.wind.${r}`]??n["environment.wind.speedTrue"]??0,s=n[`environment.wind.${o}`]??n["environment.wind.angleTrueWater"]??0,u=n["environment.wind.angleApparent"]??0,c=n["environment.wind.speedApparent"]??0,m=(0,i.useCallback)((e,r)=>{t(t=>({...t,[e]:r}))},[]),d=(0,i.useCallback)(e=>{m("mainCar",e)},[m]),f=(0,i.useCallback)(e=>{m("jibCar",e)},[m]),h=(0,i.useCallback)(e=>{m("tension",e)},[m]),p=(0,i.useCallback)(e=>{let t=1.9438444924574*e;return t>25?2:+(t>18)},[]),g=(0,i.useMemo)(()=>p(l),[l,p]),x=(0,i.useMemo)(()=>({tws:l,twa:s,awa:u,aws:c}),[l,s,u,c]),M=(0,i.useMemo)(()=>({...e,reefLevel:g,...x}),[e,g,x]);return{trimState:e,windData:x,reefLevel:g,sailTrimParams:M,setMainCar:d,setJibCar:f,setTension:h,setTrimValue:m}})(),d=(0,i.useMemo)(()=>({...(0,eU.updateSailTrim)({tws:a.windData.tws,twa:a.windData.twa,awa:a.windData.awa,mainCar:a.trimState.mainCar,jibCar:a.trimState.jibCar,tension:a.trimState.tension}),trimState:a.trimState}),[a.windData,a.trimState]);return(0,n.jsxs)(i.Suspense,{fallback:(0,n.jsx)(u.Html,{children:"Loading..."}),children:[(0,n.jsx)(s.PerspectiveCamera,{makeDefault:!0,fov:60,near:5,far:2500,position:[0,5,20]}),(0,n.jsx)(l.OrbitControls,{enableZoom:!0,enableRotate:!0,maxPolarAngle:Math.PI/2,minPolarAngle:Math.PI/4,enableDamping:!1,zoomSpeed:.5,rotateSpeed:.5}),(0,n.jsx)(c.Environment,{files:"./assets/ocearo_env.hdr",background:!1,intensity:.8,resolution:256}),(0,n.jsx)(eF,{}),(0,n.jsxs)("group",{position:[0,-3,0],children:[(0,n.jsx)(m.default,{position:[0,.2*("chart"===t.oceanMode||"meteo"===t.oceanMode),0],scale:[.7,.7,.7],ref:r,showSail:!0,onUpdateInfoPanel:e,sailTrimData:d}),"black"!==t.oceanMode&&(0,n.jsx)(U,{lite:"water"!==t.oceanMode}),"chart"===t.oceanMode&&(0,n.jsx)(J,{mode:"chart"}),"meteo"===t.oceanMode&&(0,n.jsx)(J,{mode:"meteo"}),(0,n.jsx)(x,{}),t.showLaylines3D&&(0,n.jsx)(eR,{outerRadius:5.6}),t.showPolar&&"black"===t.oceanMode&&(0,n.jsx)(ek,{}),t.ais&&(0,n.jsx)(et.AISProvider,{children:(0,n.jsx)(ep,{onUpdateInfoPanel:e})}),(0,n.jsx)(eP,{visible:!0}),!1!==O.default.get("showSailTrimSliders")&&(0,n.jsx)(eZ,{})]}),o&&(0,n.jsx)("axesHelper",{args:[100]})]})}],67225)},59465,e=>{e.n(e.i(67225))}]);