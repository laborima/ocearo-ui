(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,74452,(e,t,r)=>{t.exports={vpp:{angles:[52,60,75,90,110,120,135,150],speeds:[6,8,10,12,14,16,20],52:[4.98,5.86,6.31,6.45,6.51,6.52,6.41],60:[5.25,6.11,6.56,6.73,6.79,6.82,6.79],75:[5.45,6.33,6.77,7.01,7.13,7.2,7.24],90:[5.66,6.55,7,7.25,7.38,7.53,7.7],110:[5.49,6.49,7.04,7.4,7.69,7.97,8.38],120:[5.32,6.36,6.97,7.39,7.77,8.1,8.6],135:[4.81,5.92,6.68,7.15,7.55,7.95,8.85],150:[4.09,5.17,6.04,6.61,6.99,7.31,7.93],beat_angle:[43.6,42,41.2,41.2,41.7,42.1,44.2],beat_vmg:[3.26,3.91,4.24,4.34,4.36,4.34,4.16],run_angle:[144.8,147.8,148.5,149.6,171.8,175.4,177.2],run_vmg:[3.54,4.48,5.23,5.73,6.17,6.67,7.36]}}},67225,e=>{"use strict";let t,r;var n,i,o,a,l=e.i(43476),s=e.i(71645),c=e.i(30297),u=e.i(82897),d=e.i(60099),f=e.i(43257),m=e.i(66326),p=e.i(25234),h=e.i(67335),v=e.i(90072),g=e.i(67561),x=e.i(85709);let y=(n={time:0,speed:1,scale:3,opacity:.4,color:new v.Color(17510),foamColor:new v.Color(8965375),waterColor:new v.Color(6694),rainbowActive:0},i=`
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
  `,(a=class extends v.ShaderMaterial{constructor(e){for(const t in super({vertexShader:i,fragmentShader:o,...e}),n)this.uniforms[t]=new v.Uniform(n[t]),Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(e){this.uniforms[t].value=e}});this.uniforms=v.UniformsUtils.clone(this.uniforms)}}).key=v.MathUtils.generateUUID(),a);(0,h.extend)({TrailShaderMaterial:y});let w=({color:e="#004466",waterColor:t="#001a26",foamColor:r="#88ccff",speed:n=1,scale:i=3,opacity:o=.4})=>{let a=(0,s.useRef)(),{nightMode:c}=(0,g.useOcearoContext)(),u=(0,x.useSignalKPath)("steering.autopilot.state"),d=(0,s.useRef)(!1);(0,s.useEffect)(()=>{d.current="auto"===u},[u]),(0,p.useFrame)((e,t)=>{a.current&&(a.current.uniforms.time.value+=t,a.current.uniforms.rainbowActive.value=+!!d.current)});let f=(0,s.useMemo)(()=>new v.Color(c?"#002233":e),[c,e]),m=(0,s.useMemo)(()=>new v.Color(c?"#000811":t),[c,t]),h=(0,s.useMemo)(()=>new v.Color(c?g.oBlue:r),[c,r]);return(0,l.jsxs)("mesh",{rotation:[-Math.PI/2,0,Math.PI/2],position:[0,0,22.5],children:[(0,l.jsx)("planeGeometry",{args:[40,2.2,128,32]}),(0,l.jsx)("trailShaderMaterial",{ref:a,color:f,waterColor:m,foamColor:h,speed:n,scale:i,opacity:o,transparent:!0,depthWrite:!1,blending:v.AdditiveBlending})]})};var M=e.i(28600),S=e.i(60602),b=v,C=e.i(8560);class E extends b.Mesh{constructor(e,t={}){super(e),this.isWater=!0;const r=this,n=void 0!==t.textureWidth?t.textureWidth:512,i=void 0!==t.textureHeight?t.textureHeight:512,o=void 0!==t.clipBias?t.clipBias:0,a=void 0!==t.alpha?t.alpha:1,l=void 0!==t.time?t.time:0,s=void 0!==t.waterNormals?t.waterNormals:null,c=void 0!==t.sunDirection?t.sunDirection:new b.Vector3(.70707,.70707,0),u=new b.Color(void 0!==t.sunColor?t.sunColor:0xffffff),d=new b.Color(void 0!==t.waterColor?t.waterColor:8355711),f=void 0!==t.eye?t.eye:new b.Vector3(0,0,0),m=void 0!==t.distortionScale?t.distortionScale:20,p=void 0!==t.side?t.side:b.FrontSide,h=void 0!==t.fog&&t.fog,v=new b.Plane,g=new b.Vector3,x=new b.Vector3,y=new b.Vector3,w=new b.Matrix4,M=new b.Vector3(0,0,-1),S=new b.Vector4,E=new b.Vector3,P=new b.Vector3,_=new b.Vector4,A=new b.Matrix4,T=new b.PerspectiveCamera,j=new b.WebGLRenderTarget(n,i,{type:b.HalfFloatType}),z={name:"MirrorShader",uniforms:b.UniformsUtils.merge([C.UniformsLib.fog,C.UniformsLib.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new b.Matrix4},sunColor:{value:new b.Color(8355711)},sunDirection:{value:new b.Vector3(.70707,.70707,0)},eye:{value:new b.Vector3},waterColor:{value:new b.Color(5592405)}}]),vertexShader:`
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
				}`},R=new b.ShaderMaterial({name:z.name,uniforms:b.UniformsUtils.clone(z.uniforms),vertexShader:z.vertexShader,fragmentShader:z.fragmentShader,lights:!0,side:p,fog:h});R.uniforms.mirrorSampler.value=j.texture,R.uniforms.textureMatrix.value=A,R.uniforms.alpha.value=a,R.uniforms.time.value=l,R.uniforms.normalSampler.value=s,R.uniforms.sunColor.value=u,R.uniforms.waterColor.value=d,R.uniforms.sunDirection.value=c,R.uniforms.distortionScale.value=m,R.uniforms.eye.value=f,r.material=R,r.onBeforeRender=function(e,t,n){if(x.setFromMatrixPosition(r.matrixWorld),y.setFromMatrixPosition(n.matrixWorld),w.extractRotation(r.matrixWorld),g.set(0,0,1),g.applyMatrix4(w),E.subVectors(x,y),E.dot(g)>0)return;E.reflect(g).negate(),E.add(x),w.extractRotation(n.matrixWorld),M.set(0,0,-1),M.applyMatrix4(w),M.add(y),P.subVectors(x,M),P.reflect(g).negate(),P.add(x),T.position.copy(E),T.up.set(0,1,0),T.up.applyMatrix4(w),T.up.reflect(g),T.lookAt(P),T.far=n.far,T.updateMatrixWorld(),T.projectionMatrix.copy(n.projectionMatrix),A.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),A.multiply(T.projectionMatrix),A.multiply(T.matrixWorldInverse),v.setFromNormalAndCoplanarPoint(g,x),v.applyMatrix4(T.matrixWorldInverse),S.set(v.normal.x,v.normal.y,v.normal.z,v.constant);let i=T.projectionMatrix;_.x=(Math.sign(S.x)+i.elements[8])/i.elements[0],_.y=(Math.sign(S.y)+i.elements[9])/i.elements[5],_.z=-1,_.w=(1+i.elements[10])/i.elements[14],S.multiplyScalar(2/S.dot(_)),i.elements[2]=S.x,i.elements[6]=S.y,i.elements[10]=S.z+1-o,i.elements[14]=S.w,f.setFromMatrixPosition(n.matrixWorld);let a=e.getRenderTarget(),l=e.xr.enabled,s=e.shadowMap.autoUpdate;r.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(j),e.state.buffers.depth.setMask(!0),!1===e.autoClear&&e.clear(),e.render(t,T),r.visible=!0,e.xr.enabled=l,e.shadowMap.autoUpdate=s,e.setRenderTarget(a);let c=n.viewport;void 0!==c&&e.state.viewport(c)}}}var P=v;class _ extends P.Mesh{constructor(){const e=_.SkyShader,t=new P.ShaderMaterial({name:e.name,uniforms:P.UniformsUtils.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:P.BackSide,depthWrite:!1});super(new P.BoxGeometry(1,1,1),t),this.isSky=!0}}_.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new P.Vector3},up:{value:new P.Vector3(0,1,0)},cloudScale:{value:2e-4},cloudSpeed:{value:1e-4},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
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

		}`};var A=e.i(83934);let T=e=>e===Object(e)&&!Array.isArray(e)&&"function"!=typeof e;function j(e,t){let r=(0,M.useThree)(e=>e.gl),n=(0,S.useLoader)(v.TextureLoader,T(e)?Object.values(e):e);return(0,s.useLayoutEffect)(()=>{null==t||t(n)},[t]),(0,s.useEffect)(()=>{if("initTexture"in r){let e=[];Array.isArray(n)?e=n:n instanceof v.Texture?e=[n]:T(n)&&(e=Object.values(n)),e.forEach(e=>{e instanceof v.Texture&&r.initTexture(e)})}},[r,n]),(0,s.useMemo)(()=>{if(!T(e))return n;{let t={},r=0;for(let i in e)t[i]=n[r++];return t}},[e,n])}j.preload=e=>S.useLoader.preload(v.TextureLoader,e),j.clear=e=>S.useLoader.clear(v.TextureLoader,e);var z=v;let R=parseInt(v.REVISION.replace(/\D+/g,""));class D extends z.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
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
	      #include <${R>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}let L=e=>new z.Vector3().setFromSpherical(new z.Spherical(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),U=s.forwardRef(({radius:e=100,depth:t=50,count:r=5e3,saturation:n=0,factor:i=4,fade:o=!1,speed:a=1},l)=>{let c=s.useRef(null),[u,d,f]=s.useMemo(()=>{let o=[],a=[],l=Array.from({length:r},()=>(.5+.5*Math.random())*i),s=new z.Color,c=e+t,u=t/r;for(let e=0;e<r;e++)c-=u*Math.random(),o.push(...L(c).toArray()),s.setHSL(e/r,n,.9),a.push(s.r,s.g,s.b);return[new Float32Array(o),new Float32Array(a),new Float32Array(l)]},[r,t,i,e,n]);(0,p.useFrame)(e=>c.current&&(c.current.uniforms.time.value=e.clock.elapsedTime*a));let[m]=s.useState(()=>new D);return s.createElement("points",{ref:l},s.createElement("bufferGeometry",null,s.createElement("bufferAttribute",{attach:"attributes-position",args:[u,3]}),s.createElement("bufferAttribute",{attach:"attributes-color",args:[d,3]}),s.createElement("bufferAttribute",{attach:"attributes-size",args:[f,1]})),s.createElement("primitive",{ref:c,object:m,attach:"material",blending:z.AdditiveBlending,"uniforms-fade-value":o,depthWrite:!1,transparent:!0,vertexColors:!0}))});var O=e.i(83402);(0,h.extend)({Water:E,Sky:_});let I=new v.Color(17510),B=new v.Color(517),V=new v.Color,G=new v.Color,F=function({lite:e=!1}){let{nightMode:t,setNightMode:r}=(0,g.useOcearoContext)(),{getWindData:n,getCurrentWeather:i}=(0,A.useWeather)(),o=(0,s.useRef)(),a=(0,s.useRef)(),c=(0,s.useRef)(),u=(0,s.useRef)(),d=(0,s.useRef)(null),f=(0,x.useSignalKPath)("navigation.position"),m=(0,s.useRef)(null);(0,s.useEffect)(()=>{m.current=f},[f]);let h=(0,s.useRef)(0),y=(0,s.useRef)(1),w=(0,M.useThree)(e=>e.gl),b=(0,M.useThree)(e=>e.scene),C=(0,s.useMemo)(()=>new v.Vector3,[]),P=j("assets/moon.jpg"),_=(0,S.useLoader)(v.TextureLoader,"assets/waternormals.jpg");(0,s.useMemo)(()=>{_.wrapS=_.wrapT=v.RepeatWrapping},[_]);let T=(0,s.useMemo)(()=>new v.PlaneGeometry(4e3,4e3,144,144),[]),z=(0,s.useMemo)(()=>new v.MeshBasicMaterial({color:73776}),[]),R=(0,s.useRef)({waveAmp:{value:0},waveTime:{value:0}}),D=(0,s.useRef)(),L=(0,s.useRef)(),F=(0,s.useRef)(!1),N=(0,s.useMemo)(()=>{let e=document.createElement("canvas");e.width=e.height=128;let t=e.getContext("2d"),r=t.createRadialGradient(64,64,8,64,64,62);return r.addColorStop(0,"rgba(255,255,255,0.85)"),r.addColorStop(.55,"rgba(255,255,255,0.35)"),r.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=r,t.fillRect(0,0,128,128),new v.CanvasTexture(e)},[]),k=(0,s.useMemo)(()=>{let e=[];for(let t=0;t<16;t++){let r=t/16*Math.PI*2+.6*Math.random(),n=500+1200*Math.random();e.push({position:[Math.cos(r)*n,260+180*Math.random(),Math.sin(r)*n],scale:[420+380*Math.random(),150+120*Math.random(),1]})}return e},[]),W=(0,s.useMemo)(()=>new v.SpriteMaterial({map:N,transparent:!0,opacity:0,depthWrite:!1,color:0xffffff}),[N]),H=(0,s.useMemo)(()=>{let e=new Float32Array(3600);for(let t=0;t<1200;t++)e[3*t]=(2*Math.random()-1)*240,e[3*t+1]=220*Math.random(),e[3*t+2]=(2*Math.random()-1)*240;let t=new v.BufferGeometry;return t.setAttribute("position",new v.BufferAttribute(e,3)),t},[]),$=(0,s.useMemo)(()=>new v.PointsMaterial({color:0x9fc4d8,size:1.6,transparent:!0,opacity:.55,depthWrite:!1,sizeAttenuation:!0}),[]),Z=(0,s.useMemo)(()=>({textureWidth:256,textureHeight:256,waterNormals:_,sunDirection:new v.Vector3,sunColor:0xffffff,waterColor:7695,distortionScale:3.7,fog:void 0!==b.fog,format:w.outputColorSpace}),[_,w.outputColorSpace,b.fog]),K=(0,s.useMemo)(()=>{if(e)return null;let t=new E(T,Z),r=R.current;return t.material.onBeforeCompile=e=>{e.uniforms.waveAmp=r.waveAmp,e.uniforms.waveTime=r.waveTime,e.vertexShader=e.vertexShader.replace("void main() {",`
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
        `).replace(/vec4\( position, 1.0 \)/g,"vec4( wavePos, 1.0 )")},t},[T,Z,e]);return(0,p.useFrame)((r,l)=>{if(o.current&&(o.current.material.uniforms.time.value+=.5*l),R.current.waveTime.value+=l,D.current&&D.current.visible&&(D.current.rotation.y+=.004*l),L.current&&F.current){let e=L.current.geometry.attributes.position,t=e.array,r=160*l;for(let e=1;e<t.length;e+=3)t[e]-=r,t[e]<0&&(t[e]+=220);e.needsUpdate=!0}if(y.current+=l,y.current<1)return;let s=y.current;y.current=0;let f=m.current,p=f&&"number"==typeof f.latitude?f.latitude:46.15,g=f&&"number"==typeof f.longitude?f.longitude:-1.15,x=new Date,w=O.default.get("debugMode"),M=x;if(w){null===d.current&&(d.current=Date.now());let e=(Date.now()-d.current)/1e3*720%86400,t=Math.floor(e/3600),r=Math.floor(e%3600/60),n=new Date(x.getTime());n.setHours(t,r,0,0),M=n}let S=new Date(M.getFullYear(),0,0),b=M-S+(S.getTimezoneOffset()-M.getTimezoneOffset())*6e4,E=Math.PI/180,P=180/Math.PI,_=M.getHours(),A=M.getMinutes(),T=2*Math.PI/365*(b/864e5-1+(_-12)/24),j=229.18*(75e-6+.001868*Math.cos(T)-.032077*Math.sin(T)-.014615*Math.cos(2*T)-.040849*Math.sin(2*T)),U=.006918-.399912*Math.cos(T)+.070257*Math.sin(T)-.006758*Math.cos(2*T)+907e-6*Math.sin(2*T)-.002697*Math.cos(3*T)+.00148*Math.sin(3*T),N=((60*_+A+(j+4*g- -M.getTimezoneOffset())+1440)%1440/4-180)*E,k=p*E,H=90-Math.acos(Math.min(Math.max(Math.sin(k)*Math.sin(U)+Math.cos(k)*Math.cos(U)*Math.cos(N),-1),1))*P,Z=(Math.atan2(Math.sin(N),Math.cos(N)*Math.sin(k)-Math.tan(U)*Math.cos(k))*P+360)%360,K=0;K=H<=-10?1:H>=5?0:(5-H)/15;let X=t||H<=-5,q=X?Math.max(H,20):Math.max(H,5),Y=v.MathUtils.degToRad(90-q),Q=v.MathUtils.degToRad(Z);if(C.setFromSphericalCoords(1,Y,Q),o.current){let e=n()?.speed??5;h.current+=(e-h.current)*Math.min(.5*s,1);let t=Math.min(Math.max(.5*h.current,0),8),r=o.current.material.uniforms;r.distortionScale.value=t,r.sunDirection.value.copy(C).normalize();let i=O.default.get("aisLengthScalingFactor")||.7,a=Math.min(.21*h.current**2/9.81,6);R.current.waveAmp.value=a/2*i,V.copy(I).lerp(B,K),r.sunColor.value.setHex(X?4491519:0xffffff),r.waterColor.value.copy(V)}e&&(V.copy(I).lerp(B,K),z.color.copy(V).multiplyScalar(1.6));let J=i(),ee=Math.min(Math.max(J?.cloudCover??0,0),1),et=Math.max(J?.rain??0,0),er=et>.05;if(D.current){D.current.visible=ee>.08;let e=(1-.7*K)*(er?.55:1);G.setScalar(e),W.color.copy(G),W.opacity=.15+.55*ee}if(F.current=er,L.current&&(L.current.visible=er,$.opacity=Math.min(.3+.15*et,.75)),a.current){let e=a.current.material.uniforms,t={turbidity:.5+.5*(J?.humidity??.6)+9*ee+4*!!er,rayleigh:1.2*(1-.5*ee),mieCoefficient:.005+.02*ee,mieDirectionalG:.8},r={turbidity:.05,rayleigh:.1,mieCoefficient:5e-4,mieDirectionalG:.95},n=e=>t[e]+(r[e]-t[e])*K;e.turbidity.value=n("turbidity"),e.rayleigh.value=n("rayleigh"),e.mieCoefficient.value=n("mieCoefficient"),e.mieDirectionalG.value=n("mieDirectionalG"),e.sunPosition.value.copy(C)}u.current&&(u.current.position.copy(C).multiplyScalar(4e3),u.current.visible=!X),c.current&&(c.current.position.copy(C).multiplyScalar(4e3),c.current.visible=X,c.current.lookAt(0,0,0))}),(0,s.useEffect)(()=>{let e=new v.Color(t?517:6694);return b.background=e,b.fog=new v.FogExp2(e,35e-5),w.outputColorSpace=v.SRGBColorSpace,()=>{b.background=null,b.fog=null}},[b,t,w]),(0,l.jsxs)(l.Fragment,{children:[t&&(0,l.jsx)(U,{radius:5e3,depth:50,count:1500,factor:4,saturation:0,fade:!0,speed:1}),(0,l.jsx)("sky",{ref:a,scale:45e4}),t&&(0,l.jsxs)("mesh",{ref:c,position:[600,200,-1500],children:[(0,l.jsx)("sphereGeometry",{args:[80,32,32]}),(0,l.jsx)("meshStandardMaterial",{map:P,emissive:0xffffff,emissiveIntensity:.8})]}),(0,l.jsxs)("mesh",{ref:u,children:[(0,l.jsx)("sphereGeometry",{args:[200,32,32]}),(0,l.jsx)("meshBasicMaterial",{color:0xffffff})]}),(0,l.jsx)("group",{ref:D,visible:!1,children:k.map((e,t)=>(0,l.jsx)("sprite",{position:e.position,scale:e.scale,material:W},t))}),(0,l.jsx)("points",{ref:L,geometry:H,material:$,visible:!1}),e?(0,l.jsx)("mesh",{geometry:T,material:z,"rotation-x":-Math.PI/2,position:[0,-.3,0]}):(0,l.jsx)("primitive",{ref:o,object:K,"rotation-x":-Math.PI/2,position:[0,-.3,0]})]})},N="https://tile.openstreetmap.org/{z}/{x}/{y}.png",k="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",W="https://tiles.windy.com/tiles/v10.0/wind/{z}/{x}/{y}.png",H="saturate(1.8) contrast(1.35)",$="brightness(0.72) saturate(1.15) contrast(1.05)";function Z(e,t,r,n){return e.replace("{z}",t).replace("{x}",r).replace("{y}",n)}function K(e,t){return 156543.03*Math.cos(e*Math.PI/180)/Math.pow(2,t)}let X=new Map;function q(e){if(X.has(e))return X.get(e);let t=new Promise(t=>{let r=new Image;r.crossOrigin="anonymous",r.onload=()=>t(r),r.onerror=()=>t(null),r.src=e});return X.set(e,t),t}async function Y(e,t,r,n){let i=await q(Z(e,t,r,n));if(i)return{img:i,sx:0,sy:0,sSize:256};for(let o=1;o<=3&&t-o>=1;o++){let a=t-o,l=r>>o,s=n>>o;if(i=await q(Z(e,a,l,s))){let e=256/Math.pow(2,o);return{img:i,sx:(r-(l<<o))*e,sy:(n-(s<<o))*e,sSize:e}}}return null}async function Q(e,t,r,n,i=1,o="none"){let a,{latitude:l,longitude:s}=t,c=256*i;e.filter=o;let u=(s+180)/360*Math.pow(2,r),d=(1-Math.log(Math.tan(a=l*Math.PI/180)+1/Math.cos(a))/Math.PI)/2*Math.pow(2,r),f=u*c-512,m=d*c-512,p=Math.floor(f/c),h=Math.floor(m/c),v=Math.ceil(1024/c)+2,g=Math.pow(2,r),x=[];for(let e=0;e<v;e++)for(let t=0;t<v;t++){let n=p+t,i=h+e;if(i<0||i>=g)continue;let o=(n%g+g)%g,a=Math.round(n*c-f),l=Math.round(i*c-m);x.push({z:r,x:o,y:i,screenLeft:a,screenTop:l})}let y=await Promise.all(x.map(e=>Y(n,e.z,e.x,e.y)));for(let t=0;t<x.length;t++){let r=y[t];if(!r)continue;let{screenLeft:n,screenTop:i}=x[t];e.drawImage(r.img,r.sx,r.sy,r.sSize,r.sSize,n,i,c,c)}e.filter="none"}async function J(e,t,r,n){let i=e.getContext("2d");for(let e of(i.clearRect(0,0,1024,1024),n)){if(!e?.template)continue;let n=Math.min(r,e.maxZoom??r),o=Math.pow(2,r-n);await Q(i,t,n,e.template,o,e.filter||"none")}}function ee({mode:e="chart"}){let t=(0,s.useRef)(),r=(0,s.useRef)(null),n=(0,s.useRef)(null),i=(0,s.useRef)(!1),o=(0,s.useRef)({position:null,zoom:null}),a=(0,s.useRef)(0),c=(0,s.useRef)("meteo"===e?[{template:N,maxZoom:19,filter:$},{template:W,maxZoom:11,filter:H}]:[{template:N,maxZoom:19,filter:$},{template:k,maxZoom:18}]),{gl:u}=(0,M.useThree)(),d=O.default.get("aisLengthScalingFactor")||.7,[f,m]=(0,s.useState)(16),[h,g]=(0,s.useState)(500),y=(0,x.useSignalKPath)("navigation.position"),w=(0,s.useRef)(null);(0,s.useEffect)(()=>{w.current=y},[y]);let S=y?.latitude!=null&&y?.longitude!=null;(0,p.useFrame)(({camera:t})=>{if(a.current++,a.current%15!=0)return;let r=w.current;if(r?.latitude==null)return;let n=Math.min(Math.max(4*(t.position.length()/d),"meteo"===e?4e4:500),6e4),i=Math.max(3,Math.min("meteo"===e?11:c.current[0]?.template===N?19:18,Math.round(Math.log2(156543.03*Math.cos(r.latitude*Math.PI/180)/(n/1024)))));i!==f&&m(i)});let b=(0,s.useCallback)((e=!1)=>{if(i.current)return;let t=w.current;if(t?.latitude==null||t?.longitude==null)return;let a=o.current;if(!e&&a.position&&a.zoom===f){let e=48*K(t.latitude,f)/111320,r=Math.abs(t.latitude-a.position.latitude),n=Math.abs(t.longitude-a.position.longitude);if(r<e&&n<e)return}let l=r.current,s=n.current;l&&s&&(i.current=!0,o.current={position:t,zoom:f},g(1024*K(t.latitude,f)/2*d),J(l,t,f,c.current).then(()=>{s.needsUpdate=!0,i.current=!1}))},[f,d]);(0,s.useEffect)(()=>{let e=document.createElement("canvas");e.width=1024,e.height=1024,r.current=e;let i=new v.CanvasTexture(e);return i.minFilter=v.LinearMipmapLinearFilter,i.magFilter=v.LinearFilter,i.anisotropy=u.capabilities.getMaxAnisotropy(),i.generateMipmaps=!0,n.current=i,t.current&&(t.current.material.map=i,t.current.material.needsUpdate=!0),()=>{i.dispose()}},[u]),(0,s.useEffect)(()=>{if("meteo"===e){c.current=[{template:N,maxZoom:19,filter:$},{template:W,maxZoom:11,filter:H}],b(!0),fetch("https://api.rainviewer.com/public/weather-maps.json").then(e=>e.json()).then(e=>{let t=e?.radar?.past,r=t?.[t.length-1]?.path;r&&(c.current=[...c.current,{template:`https://tilecache.rainviewer.com${r}/256/{z}/{x}/{y}/2/1_1.png`,maxZoom:12}],b(!0))}).catch(()=>{});return}let t=O.default.getAll().signalkUrl||"http://localhost:3000";fetch(`${t}/signalk/v1/api/resources/charts`).then(e=>e.json()).then(e=>{if(!e||"object"!=typeof e)return;let t=Object.values(e),r=t.find(e=>"openstreetmap"!==e.identifier&&e.tilemapUrl)||t.find(e=>e.tilemapUrl);r?.tilemapUrl&&(c.current=[{template:r.tilemapUrl.includes("{z}")?r.tilemapUrl:`${r.tilemapUrl}/{z}/{x}/{y}.png`,maxZoom:18}]),b(!0)}).catch(()=>{c.current=[{template:N,maxZoom:19,filter:$},{template:k,maxZoom:18}],b(!0)})},[e,b]),(0,s.useEffect)(()=>{b()},[y,e,f]),(0,s.useEffect)(()=>{t.current&&n.current&&(t.current.material.map=n.current,t.current.material.needsUpdate=!0)});let C=(0,s.useMemo)(()=>new v.PlaneGeometry(2*h,2*h),[h]),E=(0,s.useMemo)(()=>new v.MeshBasicMaterial({side:v.DoubleSide,transparent:!1}),[]);return S?(0,l.jsx)("mesh",{ref:t,geometry:C,material:E,rotation:[-Math.PI/2,0,0],position:[0,-.1,0]}):null}var et=e.i(46991),er=e.i(62588),en=e.i(47167),ei=e.i(78140);let eo=en.default.env.ASSET_PREFIX||"./",ea={},el={30:.1,36:.15,37:.1},es=`${eo}/draco/`;function ec({code:e,scaleFactor:t}){let{scene:r}=(0,ei.useGLTF)(`${eo}/boats/ais/ais-${e}.glb`,es),n=(0,s.useMemo)(()=>{let t=r.clone(!0);t.traverse(e=>{e.isMesh&&(e.material=new v.MeshStandardMaterial({color:0xeef2f5,roughness:.7,metalness:.1}),e.castShadow=!1,e.receiveShadow=!1)});let n=new v.Box3().setFromObject(t),i=new v.Vector3,o=new v.Vector3;n.getSize(i),n.getCenter(o);let a=i.x>=i.z,l=Math.max(i.x,i.z)||1,s=l*(el[e]??.06);t.position.set(-o.x,-n.min.y-s,-o.z);let c=new v.Group;return c.add(t),c.scale.setScalar(10/l),c.rotation.y=(a?Math.PI/2:0)+(ea[e]||0),c},[r,e]);return(0,l.jsx)("group",{scale:t,children:(0,l.jsx)("primitive",{object:n})})}let eu=({position:e,visible:t,boatData:r,onClick:n,ref:i})=>{let o,a=Number.isFinite(o=Number(r.shipType))?30===o?30:o>=31&&o<=32?31:o>=33&&o<=35?35:36===o?36:37===o?37:o>=40&&o<=49?40:o>=50&&o<=59?50:o>=60&&o<=69?60:o>=70&&o<=79?70:o>=80&&o<=89?80:70:70,c=Math.max(r.length||10,4);return(0,l.jsx)("group",{ref:i,position:e,visible:t,onClick:e=>{e.stopPropagation(),n&&n(r)},children:(0,l.jsx)(s.Suspense,{fallback:null,children:(0,l.jsx)(ec,{code:a,scaleFactor:c/10})})})},ed=new v.Vector3,ef=new v.Quaternion,em=new v.Quaternion,ep=new v.Euler,eh=e=>{if(e.isMesh&&e.material)return e;if(e.children?.length)for(let t of e.children){let e=eh(t);if(e)return e}return null},ev=({onUpdateInfoPanel:e})=>{let{aisData:t,vesselIds:r}=(0,er.useAIS)(),n=(0,s.useRef)({}),i=(0,s.useRef)({}),o=(0,s.useRef)({}),[a,c]=(0,s.useState)(null),u=(0,s.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),d=(0,x.useSignalKPaths)(u),f=(0,s.useMemo)(()=>{let e=d["navigation.headingTrue"]||d["navigation.headingMagnetic"],t=d["navigation.courseOverGroundTrue"]||d["navigation.courseOverGroundMagnetic"];return e||t||0},[d]),m=(0,s.useRef)(0);(0,s.useEffect)(()=>{m.current=f},[f]),(0,p.useFrame)(()=>{t&&0!==Object.keys(n.current).length&&Object.entries(n.current).forEach(([e,r])=>{if(!r)return;let n=t[e];if(!n){r.visible=!1;return}if(((e,t,r=!0)=>{let n=-t.rotationAngleY;r?(ed.set(t.sceneX,e.position.y,t.sceneZ),e.position.lerp(ed,.1),ef.setFromEuler(e.rotation),ep.set(0,n,0),em.setFromEuler(ep),ef.slerp(em,.1),e.rotation.setFromQuaternion(ef)):(e.position.set(t.sceneX,0,t.sceneZ),e.rotation.set(0,n,0))})(r,n,!0),r.visible=n.visible,r.visible){let t=o.current[e];if(!t){if(!(t=eh(r)))return;o.current[e]=t}if(!i.current[e]){let r=t.material;if(!r)return;i.current[e]={white:r.clone(),red:r.clone(),originalColor:r.color.clone()},i.current[e].white.color.copy(i.current[e].originalColor),i.current[e].red.color.set(g.oRed)}let a=i.current[e],l=r.userData.proximityColor||"white",s=l;"red"===l&&n.distanceMeters>550?s="white":"white"===l&&n.distanceMeters<500&&(s="red"),s!==l?(t.material="red"===s?a.red:a.white,r.userData.proximityColor=s):t.material&&(t.material===a.red||t.material===a.white)||(t.material="red"===l?a.red:a.white)}})});let h=(0,s.useCallback)(e=>{e&&c(t=>t&&t.mmsi===e.mmsi?null:e)},[]),v=(0,s.useMemo)(()=>r.filter(Boolean).slice().sort((e,t)=>(e.distanceMeters??1/0)-(t.distanceMeters??1/0)).slice(0,50).map(e=>(0,l.jsx)(eu,{ref:t=>{t?(t.userData={...t.userData,mmsi:e.mmsi},n.current[e.mmsi]=t):(delete n.current[e.mmsi],delete i.current[e.mmsi],delete o.current[e.mmsi])},rotation:[0,-e.rotationAngleY,0],position:[e.sceneX,0,e.sceneZ],visible:e.visible,boatData:e,onClick:h},e.mmsi)),[r,h]),y=(e,t,r="",n=!1,i=!1)=>null==t||""===t||"string"==typeof t&&0===t.trim().length?null:(n&&null!==t&&(t=(0,et.toDegrees)(t)),i&&null!==t&&(t=(0,et.toKnots)(t)),`${e}: ${t}${r}`),w=a?[y("Vessel",a.name),y("MMSI",(e=>{if(!e)return null;let t=String(e);for(let e of["urn:mrn:imo:mmsi:","urn:mrn:signalk:uuid:"])if(t.startsWith(e)){t=t.substring(e.length);break}return t})(a.mmsi)),y("RNG",a.distanceMeters?a.distanceMeters.toFixed(0):0," m"),y("LOA",a.length," m"),y("Type",a.shipType),y("SOG",a.sog," kn",!1,!0),y("COG",a.cog,"°",!0),y("HDG",a.heading,"°",!0),y("Beam",a.beam," m"),y("Draft",a.draft," m"),y("Call",a.callsign),y("Dest",a.destination)].filter(e=>null!==e).join("\n"):"";return(0,s.useEffect)(()=>{e&&e(w)},[w,e]),(0,l.jsx)(l.Fragment,{children:(0,l.jsx)("group",{rotation:[0,m.current,0],children:v})})};var eg=e.i(32615),ex=e.i(13035),ey=e.i(66799);let ew=({start:e,end:t,color:r,width:n=.2,height:i=.1,dashed:o=!1})=>{let a=(0,s.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?new v.Vector3().addVectors(e,t).multiplyScalar(.5):new v.Vector3,[e,t]),c=(0,s.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?new v.Vector3().subVectors(t,e).normalize():new v.Vector3(0,0,1),[e,t]),u=(0,s.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?e.distanceTo(t):0,[e,t]),d=(0,s.useMemo)(()=>[0,Math.atan2(c.x,c.z),0],[c]);if(!e||!t||!e.isVector3||!t.isVector3)return null;if(o){let t=Math.floor(u/.7);if(t<=0)return null;let o=[];for(let a=0;a<t;a++){let t=.7*a,s=new v.Vector3().copy(e).add(new v.Vector3().copy(c).multiplyScalar(t+.2));o.push((0,l.jsxs)("mesh",{position:s.toArray(),rotation:d,scale:[n,i,.4],children:[(0,l.jsx)("boxGeometry",{}),(0,l.jsx)("meshStandardMaterial",{color:r})]},a))}return(0,l.jsx)(l.Fragment,{children:o})}return(0,l.jsxs)("mesh",{position:a.toArray(),rotation:d,scale:[n,i,u],children:[(0,l.jsx)("boxGeometry",{}),(0,l.jsx)("meshBasicMaterial",{color:r,transparent:!0,opacity:.6,depthWrite:!1})]})},eM=({outerRadius:e=10})=>{let{convertLatLonToXY:t}=(0,g.useOcearoContext)(),r=O.default.get("debugMode"),n=(0,s.useMemo)(()=>["navigation.courseGreatCircle.nextPoint.bearingTrue","navigation.courseGreatCircle.nextPoint.distance","navigation.position"],[]),i=(0,x.useSignalKPaths)(n),[o,a]=(0,s.useState)([]),[c,u]=(0,s.useState)(null);(0,s.useEffect)(()=>{if(r)return;let e=async()=>{try{let e=await ey.default.getWaypoints();if(e){let t=Object.entries(e).map(([e,t])=>{let r=ey.default.parseWaypointPosition(t);return{id:e,name:t.name||"Waypoint",...r}}).filter(e=>e.latitude&&e.longitude);a(t)}let t=await ey.default.getCourse();u(t)}catch(e){console.warn("LayLines3D: Could not fetch navigation data:",e.message)}};e();let t=setInterval(e,3e4);return()=>clearInterval(t)},[r]);let d=i["navigation.courseGreatCircle.nextPoint.bearingTrue"]??v.MathUtils.degToRad(30),f=i["navigation.courseGreatCircle.nextPoint.distance"]??20,m=i["navigation.position"],p=(0,s.useMemo)(()=>new v.Vector3(0,0,0),[]),h=(0,s.useMemo)(()=>{if(r)return new v.Vector3(3,0,-5);if(c?.nextPoint?.position){let e=c.nextPoint.position;if(m?.latitude&&m?.longitude&&e.latitude&&e.longitude){let{x:r,y:n}=t({lat:e.latitude,lon:e.longitude},{lat:m.latitude,lon:m.longitude});return new v.Vector3(.01*r,0,-(.01*n))}}return void 0!==d&&void 0!==f?function(e,t,r=1){return new v.Vector3(e*Math.sin(t)*r,0,-e*Math.cos(t)*r)}(Math.min(.001*f,2*e),d,1):new v.Vector3(0,0,-5)},[r,c,m,d,f,t,e]),y=(0,s.useMemo)(()=>{let e=h.x,t=h.z;return{port:new v.Vector3(0,0,t),starboard:new v.Vector3(e,0,0)}},[h]);return(0,l.jsx)("group",{children:(0,l.jsxs)(l.Fragment,{children:[(0,l.jsxs)(ex.Sphere,{position:h.toArray(),args:[.5,16,16],"material-color":g.oYellow,children:[(0,l.jsxs)("mesh",{position:[0,0,0],rotation:[0,Math.PI/2,0],children:[(0,l.jsx)("cylinderGeometry",{args:[.05,.05,1,8]}),(0,l.jsx)("meshStandardMaterial",{color:"black"})]}),(0,l.jsxs)("mesh",{position:[0,0,0],rotation:[Math.PI/2,0,0],children:[(0,l.jsx)("cylinderGeometry",{args:[.05,.05,1,8]}),(0,l.jsx)("meshStandardMaterial",{color:"black"})]})]}),(0,l.jsx)(ew,{start:p,end:y.port,color:g.oGreen,width:.2,height:.1}),(0,l.jsx)(ew,{start:y.port,end:h,color:g.oGreen,width:.2,height:.1}),(0,l.jsx)(ew,{start:p,end:y.starboard,color:g.oRed,width:.2,height:.1}),(0,l.jsx)(ew,{start:y.starboard,end:h,color:g.oRed,width:.2,height:.1})]})})};var eS=e.i(31067),eb=v,eC=v;let eE=new eC.Box3,eP=new eC.Vector3;class e_ extends eC.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new eC.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new eC.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,r=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),r.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new eC.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new eC.InterleavedBufferAttribute(r,3,0)),this.setAttribute("instanceEnd",new eC.InterleavedBufferAttribute(r,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let r;e instanceof Float32Array?r=e:Array.isArray(e)&&(r=new Float32Array(e));let n=new eC.InstancedInterleavedBuffer(r,2*t,1);return this.setAttribute("instanceColorStart",new eC.InterleavedBufferAttribute(n,t,0)),this.setAttribute("instanceColorEnd",new eC.InterleavedBufferAttribute(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new eC.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new eC.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),eE.setFromBufferAttribute(t),this.boundingBox.union(eE))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new eC.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let r=this.boundingSphere.center;this.boundingBox.getCenter(r);let n=0;for(let i=0,o=e.count;i<o;i++)eP.fromBufferAttribute(e,i),n=Math.max(n,r.distanceToSquared(eP)),eP.fromBufferAttribute(t,i),n=Math.max(n,r.distanceToSquared(eP));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var eA=v,eT=e.i(31497);class ej extends eA.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:eA.UniformsUtils.clone(eA.UniformsUtils.merge([C.UniformsLib.common,C.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new eA.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${eT.version>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let ez=eT.version>=125?"uv1":"uv2",eR=new eb.Vector4,eD=new eb.Vector3,eL=new eb.Vector3,eU=new eb.Vector4,eO=new eb.Vector4,eI=new eb.Vector4,eB=new eb.Vector3,eV=new eb.Matrix4,eG=new eb.Line3,eF=new eb.Vector3,eN=new eb.Box3,ek=new eb.Sphere,eW=new eb.Vector4;function eH(e,t,n){return eW.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),eW.multiplyScalar(1/eW.w),eW.x=r/n.width,eW.y=r/n.height,eW.applyMatrix4(e.projectionMatrixInverse),eW.multiplyScalar(1/eW.w),Math.abs(Math.max(eW.x,eW.y))}class e$ extends eb.Mesh{constructor(e=new e_,t=new ej({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,r=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,i=0,o=t.count;e<o;e++,i+=2)eD.fromBufferAttribute(t,e),eL.fromBufferAttribute(r,e),n[i]=0===i?0:n[i-1],n[i+1]=n[i]+eD.distanceTo(eL);let i=new eb.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new eb.InterleavedBufferAttribute(i,1,0)),e.setAttribute("instanceDistanceEnd",new eb.InterleavedBufferAttribute(i,1,1)),this}raycast(e,n){let i,o,a=this.material.worldUnits,l=e.camera;null!==l||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let s=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let c=this.matrixWorld,u=this.geometry,d=this.material;if(r=d.linewidth+s,null===u.boundingSphere&&u.computeBoundingSphere(),ek.copy(u.boundingSphere).applyMatrix4(c),a)i=.5*r;else{let e=Math.max(l.near,ek.distanceToPoint(t.origin));i=eH(l,e,d.resolution)}if(ek.radius+=i,!1!==t.intersectsSphere(ek)){if(null===u.boundingBox&&u.computeBoundingBox(),eN.copy(u.boundingBox).applyMatrix4(c),a)o=.5*r;else{let e=Math.max(l.near,eN.distanceToPoint(t.origin));o=eH(l,e,d.resolution)}eN.expandByScalar(o),!1!==t.intersectsBox(eN)&&(a?function(e,n){let i=e.matrixWorld,o=e.geometry,a=o.attributes.instanceStart,l=o.attributes.instanceEnd,s=Math.min(o.instanceCount,a.count);for(let o=0;o<s;o++){eG.start.fromBufferAttribute(a,o),eG.end.fromBufferAttribute(l,o),eG.applyMatrix4(i);let s=new eb.Vector3,c=new eb.Vector3;t.distanceSqToSegment(eG.start,eG.end,c,s),c.distanceTo(s)<.5*r&&n.push({point:c,pointOnLine:s,distance:t.origin.distanceTo(c),object:e,face:null,faceIndex:o,uv:null,[ez]:null})}}(this,n):function(e,n,i){let o=n.projectionMatrix,a=e.material.resolution,l=e.matrixWorld,s=e.geometry,c=s.attributes.instanceStart,u=s.attributes.instanceEnd,d=Math.min(s.instanceCount,c.count),f=-n.near;t.at(1,eI),eI.w=1,eI.applyMatrix4(n.matrixWorldInverse),eI.applyMatrix4(o),eI.multiplyScalar(1/eI.w),eI.x*=a.x/2,eI.y*=a.y/2,eI.z=0,eB.copy(eI),eV.multiplyMatrices(n.matrixWorldInverse,l);for(let n=0;n<d;n++){if(eU.fromBufferAttribute(c,n),eO.fromBufferAttribute(u,n),eU.w=1,eO.w=1,eU.applyMatrix4(eV),eO.applyMatrix4(eV),eU.z>f&&eO.z>f)continue;if(eU.z>f){let e=eU.z-eO.z,t=(eU.z-f)/e;eU.lerp(eO,t)}else if(eO.z>f){let e=eO.z-eU.z,t=(eO.z-f)/e;eO.lerp(eU,t)}eU.applyMatrix4(o),eO.applyMatrix4(o),eU.multiplyScalar(1/eU.w),eO.multiplyScalar(1/eO.w),eU.x*=a.x/2,eU.y*=a.y/2,eO.x*=a.x/2,eO.y*=a.y/2,eG.start.copy(eU),eG.start.z=0,eG.end.copy(eO),eG.end.z=0;let s=eG.closestPointToPointParameter(eB,!0);eG.at(s,eF);let d=eb.MathUtils.lerp(eU.z,eO.z,s),m=d>=-1&&d<=1,p=eB.distanceTo(eF)<.5*r;if(m&&p){eG.start.fromBufferAttribute(c,n),eG.end.fromBufferAttribute(u,n),eG.start.applyMatrix4(l),eG.end.applyMatrix4(l);let r=new eb.Vector3,o=new eb.Vector3;t.distanceSqToSegment(eG.start,eG.end,o,r),i.push({point:o,pointOnLine:r,distance:t.origin.distanceTo(o),object:e,face:null,faceIndex:n,uv:null,[ez]:null})}}}(this,l,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(eR),this.material.uniforms.resolution.value.set(eR.z,eR.w))}}class eZ extends e_{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,r=new Float32Array(2*t);for(let n=0;n<t;n+=3)r[2*n]=e[n],r[2*n+1]=e[n+1],r[2*n+2]=e[n+2],r[2*n+3]=e[n+3],r[2*n+4]=e[n+4],r[2*n+5]=e[n+5];return super.setPositions(r),this}setColors(e,t=3){let r=e.length-t,n=new Float32Array(2*r);if(3===t)for(let i=0;i<r;i+=t)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];else for(let i=0;i<r;i+=t)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5],n[2*i+6]=e[i+6],n[2*i+7]=e[i+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class eK extends e${constructor(e=new eZ,t=new ej({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let eX=s.forwardRef(function({points:e,color:t=0xffffff,vertexColors:r,linewidth:n,lineWidth:i,segments:o,dashed:a,...l},c){var u,d;let f=(0,M.useThree)(e=>e.size),m=s.useMemo(()=>o?new e$:new eK,[o]),[p]=s.useState(()=>new ej),h=(null==r||null==(u=r[0])?void 0:u.length)===4?4:3,g=s.useMemo(()=>{let n=o?new e_:new eZ,i=e.map(e=>{let t=Array.isArray(e);return e instanceof v.Vector3||e instanceof v.Vector4?[e.x,e.y,e.z]:e instanceof v.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(i.flat()),r){t=0xffffff;let e=r.map(e=>e instanceof v.Color?e.toArray():e);n.setColors(e.flat(),h)}return n},[e,o,r,h]);return s.useLayoutEffect(()=>{m.computeLineDistances()},[e,m]),s.useLayoutEffect(()=>{a?p.defines.USE_DASH="":delete p.defines.USE_DASH,p.needsUpdate=!0},[a,p]),s.useEffect(()=>()=>{g.dispose(),p.dispose()},[g]),s.createElement("primitive",(0,eS.default)({object:m,ref:c},l),s.createElement("primitive",{object:g,attach:"geometry"}),s.createElement("primitive",(0,eS.default)({object:p,attach:"material",color:t,vertexColors:!!r,resolution:[f.width,f.height],linewidth:null!=(d=null!=n?n:i)?d:1,dashed:a,transparent:4===h},l)))});var eq=e.i(74452);let eY={DEG2RAD:Math.PI/180,ROTATION_INTERPOLATION_FACTOR:.05,SOG_SMOOTHING_FACTOR:.1,DEFAULT_SOG:3,ANGLE_INCREMENT:10,SPHERE_SIZE:.4,SPHERE_SEGMENTS:32,PLOTS_COUNT:5,FRAME_TO_MINUTE_RATIO:3600},eQ=(e,t)=>.44704*e*60*t*.1,eJ=(e,t,r)=>{if(!e||!t)return new v.Vector3(0,0,0);let n=e*eY.DEG2RAD,i=eQ(t,r);return new v.Vector3(i*Math.sin(n),0,-i*Math.cos(n))},e0=({position:e,color:t})=>e?(0,l.jsxs)("mesh",{position:e,children:[(0,l.jsx)("sphereGeometry",{args:[eY.SPHERE_SIZE,eY.SPHERE_SEGMENTS,eY.SPHERE_SEGMENTS]}),(0,l.jsx)("meshBasicMaterial",{color:t,transparent:!0,opacity:.8})]}):null,e1=({points:e,color:t})=>e?.length?(0,l.jsx)(eX,{points:e,color:t,lineWidth:2,transparent:!0,opacity:.5}):null,e2=s.default.memo(({timeInMinute:e,windSpeed:t})=>{let r=(0,s.useRef)(eq.default.vpp),n=(0,s.useCallback)((e,t,r,n)=>{if(!e?.length||!t?.length||e.length<=r||t.length<=r)return console.warn("Invalid angle or VMG data"),null;let i=e[r],o=t[r],a=i*eY.DEG2RAD,l=eQ(o,n);return new v.Vector3(l*Math.sin(a),0,-l*Math.cos(a))},[]),i=(0,s.useCallback)((e,t)=>{let{speeds:n,angles:i,beat_angle:o,beat_vmg:a,run_angle:l,run_vmg:s}=r.current;if(!n?.length||!i?.length)return console.warn("Invalid polar data"),null;let c=[],u=(e,r,n)=>{for(let i=e;i<=r;i+=eY.ANGLE_INCREMENT)c.push(eJ(i,n(i),t))};u(0,o[e]-eY.ANGLE_INCREMENT,t=>{let r;return r=a[e],0+t/o[e]*(r-0)});let d=eJ(o[e],a[e],t);c.push(d),i.forEach(n=>{if(n>o[e]&&n<l[e]){let i=r.current[Math.floor(n)]?.[e]||0;c.push(eJ(n,i,t))}});let f=eJ(l[e],s[e],t);return c.push(f),u(l[e]+eY.ANGLE_INCREMENT,180,()=>s[e]),new v.CatmullRomCurve3(c,!0)},[]),o=(0,s.useMemo)(()=>{let o=r.current;if(!o?.speeds?.length)return console.warn("Invalid polar data structure"),{curve:null,beat:null,run:null};let a=((e,t)=>{if(!e?.length)return 0;let r=0,n=e.length-1;for(;r<n;){let i=Math.floor((r+n)/2);e[i]<t?r=i+1:n=i}return r})(o.speeds,t);return{curve:i(a,e),beat:n(o.beat_angle,o.beat_vmg,a,e),run:n(o.run_angle,o.run_vmg,a,e)}},[e,t,n,i]),a=[0,-Math.PI];return(0,l.jsx)(l.Fragment,{children:a.map((e,t)=>(0,l.jsxs)("group",{position:[0,-.7,0],rotation:[0,0,e],children:[o.curve&&(0,l.jsx)(e1,{points:o.curve.getPoints(100),color:g.oBlue}),(0,l.jsx)(e0,{position:o.beat,color:g.oGreen}),(0,l.jsx)(e0,{position:o.run,color:g.oRed})]},t))})});e2.displayName="PolarPlot";let e3=function(){let e=(0,s.useRef)([]),[t,r]=(0,s.useState)([]),n=(0,s.useRef)(0),i=(0,s.useRef)([]),o=(0,s.useRef)(eY.DEFAULT_SOG),a=O.default.get("preferredWindSpeedPath")||"speedTrue",c=O.default.get("preferredWindDirectionPath")||"angleTrueWater",u=(0,s.useMemo)(()=>[`environment.wind.${c}`,`environment.wind.${a}`,"environment.wind.angleTrueWater","environment.wind.angleTrueGround","environment.wind.speedTrue","environment.wind.speedOverGround","environment.wind.angleApparent","environment.wind.speedApparent","navigation.speedOverGround","navigation.headingTrue","navigation.courseOverGroundTrue"],[c,a]),d=(0,x.useSignalKPaths)(u),f=(0,s.useMemo)(()=>{let e=d["environment.wind.angleApparent"],t=d["environment.wind.speedApparent"];if(null!=e&&null!=t&&t>0)return-e;if("directionTrue"===c){let e=d["environment.wind.directionTrue"];if(null!=e)return-(e-(d["navigation.headingTrue"]??d["navigation.courseOverGroundTrue"]??0));let t=d["environment.wind.angleTrueGround"]??d["environment.wind.angleTrueWater"];return null!=t?-t:0}let r=d[`environment.wind.${c}`]??d["environment.wind.angleTrueWater"]??d["environment.wind.angleTrueGround"];return null!=r?-r:0},[d,c]),m=(0,s.useMemo)(()=>{let e=d[`environment.wind.${a}`]??d["environment.wind.speedTrue"]??d["environment.wind.speedOverGround"];return(0,et.convertWindSpeed)(e)||0},[d,a]),h=d["navigation.speedOverGround"]||eY.DEFAULT_SOG,g=(0,s.useRef)(m),[y,w]=(0,s.useState)(Date.now()),M=(0,s.useRef)(null);return(0,s.useEffect)(()=>{let t=Array.from({length:eY.PLOTS_COUNT},(e,t)=>({id:t,timeInMinute:5*(t+1)}));return r(t),e.current=t.map(()=>new v.Group),i.current=Array(eY.PLOTS_COUNT).fill(0),M.current=setInterval(()=>{w(Date.now()),n.current=0},12e4),()=>{M.current&&clearInterval(M.current)}},[]),(0,s.useEffect)(()=>{Math.abs(g.current-m)>5&&(w(Date.now()),n.current=0,g.current=m)},[m]),(0,p.useFrame)(()=>{n.current+=1,o.current=v.MathUtils.lerp(o.current,h,eY.SOG_SMOOTHING_FACTOR),t.forEach((t,r)=>{let o=e.current[r];if(o&&t.timeInMinute-n.current/eY.FRAME_TO_MINUTE_RATIO>0){let e=i.current[r],t=v.MathUtils.lerp(e,f,eY.ROTATION_INTERPOLATION_FACTOR);o.rotation.set(0,t,0),i.current[r]=t}})}),(0,l.jsx)(l.Fragment,{children:t.map((t,r)=>(0,l.jsx)("group",{ref:t=>{t&&(e.current[r]=t)},children:(0,l.jsx)(e2,{timeInMinute:t.timeInMinute,windSpeed:m},`plot-${y}-${r}`)},`${t.id}-${y}`))})},e5=()=>{let{states:e,nightMode:t}=(0,g.useOcearoContext)(),r=t?.3:.5;return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("ambientLight",{intensity:t?.2:.4}),(0,l.jsx)("directionalLight",{position:[0,70,-100],intensity:t?.6:1.2,castShadow:!1,color:t?"#b0d8ff":"#ffffff"}),(0,l.jsx)("spotLight",{position:[0,50,100],intensity:2*r,angle:.6,penumbra:1,color:t?"#4080ff":"#ffffff"}),(0,l.jsx)("pointLight",{position:[0,40,-80],intensity:2.5*r,distance:150,decay:2}),(0,l.jsx)("pointLight",{position:[0,30,100],intensity:.8*r,distance:120,decay:2})]})},e4={mainCar:.5,jibCar:.5,tension:.5,reefLevel:0};var e6=e.i(5941),e7=e.i(16196);let e9="#333333",e8="#222222",te=[{label:"GV",centerDeg:180,color:"#09bfff",key:"mainCar",mode:"position"},{label:"FP",centerDeg:260,color:"#15bd6f",key:"jibCar",side:"port",mode:"fill"},{label:"FS",centerDeg:100,color:"#bf1515",key:"jibCar",side:"starboard",mode:"fill"}];function tt(e,t){let r=v.MathUtils.degToRad(e-90);return[t*Math.cos(r),t*Math.sin(r)]}let tr=({label:e,value:t,centerDeg:r,color:n})=>{let i=Math.max(0,Math.min(1,t)),o=(0,s.useMemo)(()=>{let e=[],t=r-15;for(let r=0;r<=12;r++){let o=r/12,[a,s]=tt(t+30*o,4.2),c=Math.abs(o-i),u=c<=.041666666666666664,d=c<=.125,f=.041666666666666664>=Math.abs(o-.5),m=e9,p=.09,h=.3;u?(m=n,p=.16,h=1):d?(m=n,p=.09,h=.5):f&&(h=.5),e.push((0,l.jsx)(ex.Sphere,{args:[p,8,8],position:[a,0,s],children:(0,l.jsx)("meshBasicMaterial",{color:m,transparent:!0,opacity:h})},r))}return e},[i,r,n]),a=v.MathUtils.degToRad(r-90),c=3.6*Math.cos(a),u=3.6*Math.sin(a);return(0,l.jsxs)("group",{children:[o,(0,l.jsx)(e7.Text,{position:[c,-.4,u],color:n,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-a],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e})]})},tn=({label:e,value:t,centerDeg:r,color:n,active:i})=>{let o=Math.max(0,Math.min(1,t)),a=(0,s.useMemo)(()=>{let e=[],t=r-15;for(let r=0;r<=12;r++){let a=r/12,[s,c]=tt(t+30*a,4.2),u=e8,d=.09,f=.15;if(i){let e=a<=o;.041666666666666664>=Math.abs(a-o)?(u=n,d=.16,f=1):e?(u=n,f=.7):(u=e9,f=.3)}e.push((0,l.jsx)(ex.Sphere,{args:[d,8,8],position:[s,0,c],children:(0,l.jsx)("meshBasicMaterial",{color:u,transparent:!0,opacity:f})},r))}return e},[o,r,n,i]),c=v.MathUtils.degToRad(r-90),u=3.6*Math.cos(c),d=3.6*Math.sin(c);return(0,l.jsxs)("group",{children:[a,(0,l.jsx)(e7.Text,{position:[u,-.4,d],color:i?n:e8,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-c],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:i?.9:.2,children:e})]})},ti=()=>{let e=(0,x.useSignalKPath)("environment.wind.angleApparent",0),t=(0,x.useSignalKPath)("environment.wind.speedApparent",0),r=(0,s.useMemo)(()=>{let t=e;for(;t<0;)t+=2*Math.PI;for(;t>=2*Math.PI;)t-=2*Math.PI;return t>Math.PI},[e]),{mainCar:n,jibCar:i}=(0,s.useMemo)(()=>(function(e,t){let r=e;for(;r<0;)r+=2*Math.PI;for(;r>=2*Math.PI;)r-=2*Math.PI;let n=r>Math.PI,i=Math.max(0,1-(n?2*Math.PI-r:r)/(.75*Math.PI)),o=Math.min(1,Math.abs(t)/15),a=(1-i)*.4*o;return{mainCar:n?.5-a:.5+a,jibCar:Math.max(.05,Math.min(1,(1-i)*.7+.2*o+.1))}})(e,t),[e,t]);return(0,l.jsx)("group",{children:te.map(e=>{let t="mainCar"===e.key?n:i,o=!0;return("port"===e.side&&(o=!r),"starboard"===e.side&&(o=r),"position"===e.mode)?(0,l.jsx)(tr,{label:e.label,value:t,centerDeg:e.centerDeg,color:e.color},e.label):(0,l.jsx)(tn,{label:e.label,value:t,centerDeg:e.centerDeg,color:e.color,active:o},e.label)})})};e.s(["default",0,({onUpdateInfoPanel:e})=>{let{states:t}=(0,g.useOcearoContext)(),r=(0,s.useRef)(),n=O.default.get("debugShowAxes"),i=(()=>{let[e,t]=(0,s.useState)(e4),r=O.default.get("preferredWindSpeedPath")||"speedTrue",n=O.default.get("preferredWindDirectionPath")||"angleTrueWater",i=(0,s.useMemo)(()=>[`environment.wind.${r}`,`environment.wind.${n}`,"environment.wind.speedTrue","environment.wind.angleTrueWater","environment.wind.angleApparent","environment.wind.speedApparent"],[r,n]),o=(0,x.useSignalKPaths)(i),a=o[`environment.wind.${r}`]??o["environment.wind.speedTrue"]??0,l=o[`environment.wind.${n}`]??o["environment.wind.angleTrueWater"]??0,c=o["environment.wind.angleApparent"]??0,u=o["environment.wind.speedApparent"]??0,d=(0,s.useCallback)((e,r)=>{t(t=>({...t,[e]:r}))},[]),f=(0,s.useCallback)(e=>{d("mainCar",e)},[d]),m=(0,s.useCallback)(e=>{d("jibCar",e)},[d]),p=(0,s.useCallback)(e=>{d("tension",e)},[d]),h=(0,s.useCallback)(e=>{let t=1.9438444924574*e;return t>25?2:+(t>18)},[]),v=(0,s.useMemo)(()=>h(a),[a,h]),g=(0,s.useMemo)(()=>({tws:a,twa:l,awa:c,aws:u}),[a,l,c,u]),y=(0,s.useMemo)(()=>({...e,reefLevel:v,...g}),[e,v,g]);return{trimState:e,windData:g,reefLevel:v,sailTrimParams:y,setMainCar:f,setJibCar:m,setTension:p,setTrimValue:d}})(),o=(0,s.useMemo)(()=>({...(0,e6.updateSailTrim)({tws:i.windData.tws,twa:i.windData.twa,awa:i.windData.awa,mainCar:i.trimState.mainCar,jibCar:i.trimState.jibCar,tension:i.trimState.tension}),trimState:i.trimState}),[i.windData,i.trimState]);return(0,l.jsxs)(s.Suspense,{fallback:(0,l.jsx)(d.Html,{children:"Loading..."}),children:[(0,l.jsx)(u.PerspectiveCamera,{makeDefault:!0,fov:60,near:5,far:2500,position:[0,5,20]}),(0,l.jsx)(c.OrbitControls,{enableZoom:!0,enableRotate:!0,maxPolarAngle:Math.PI/2,minPolarAngle:Math.PI/4,enableDamping:!1,zoomSpeed:.5,rotateSpeed:.5}),(0,l.jsx)(f.Environment,{files:"./assets/ocearo_env.hdr",background:!1,intensity:.8,resolution:256}),(0,l.jsx)(e5,{}),(0,l.jsxs)("group",{position:[0,-3,0],children:[(0,l.jsx)(m.default,{position:[0,0,0],scale:[.7,.7,.7],ref:r,showSail:!0,onUpdateInfoPanel:e,sailTrimData:o}),"black"!==t.oceanMode&&(0,l.jsx)(F,{lite:"water"!==t.oceanMode}),"chart"===t.oceanMode&&(0,l.jsx)(ee,{mode:"chart"}),"meteo"===t.oceanMode&&(0,l.jsx)(ee,{mode:"meteo"}),(0,l.jsx)(w,{}),t.showLaylines3D&&(0,l.jsx)(eM,{outerRadius:5.6}),t.showPolar&&"black"===t.oceanMode&&(0,l.jsx)(e3,{}),t.ais&&(0,l.jsx)(er.AISProvider,{children:(0,l.jsx)(ev,{onUpdateInfoPanel:e})}),(0,l.jsx)(eg.default,{visible:!0}),!1!==O.default.get("showSailTrimSliders")&&(0,l.jsx)(ti,{})]}),n&&(0,l.jsx)("axesHelper",{args:[100]})]})}],67225)},59465,e=>{e.n(e.i(67225))}]);