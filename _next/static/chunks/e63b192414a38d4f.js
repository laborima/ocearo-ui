(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,96162,e=>{e.v({vpp:{angles:[52,60,75,90,110,120,135,150],speeds:[6,8,10,12,14,16,20],52:[4.98,5.86,6.31,6.45,6.51,6.52,6.41],60:[5.25,6.11,6.56,6.73,6.79,6.82,6.79],75:[5.45,6.33,6.77,7.01,7.13,7.2,7.24],90:[5.66,6.55,7,7.25,7.38,7.53,7.7],110:[5.49,6.49,7.04,7.4,7.69,7.97,8.38],120:[5.32,6.36,6.97,7.39,7.77,8.1,8.6],135:[4.81,5.92,6.68,7.15,7.55,7.95,8.85],150:[4.09,5.17,6.04,6.61,6.99,7.31,7.93],beat_angle:[43.6,42,41.2,41.2,41.7,42.1,44.2],beat_vmg:[3.26,3.91,4.24,4.34,4.36,4.34,4.16],run_angle:[144.8,147.8,148.5,149.6,171.8,175.4,177.2],run_vmg:[3.54,4.48,5.23,5.73,6.17,6.67,7.36]}})},67225,e=>{"use strict";let t,r;var n,i,o,a,s=e.i(43476),l=e.i(71645),c=e.i(30297),u=e.i(82897),d=e.i(60099),f=e.i(43257),m=e.i(66326),p=e.i(71753),h=e.i(58013),v=e.i(90072),g=e.i(67561),x=e.i(85709);let y=(n={time:0,speed:1,scale:3,opacity:.4,color:new v.Color(17510),foamColor:new v.Color(8965375),waterColor:new v.Color(6694),rainbowActive:0},i=`
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
  `,(a=class extends v.ShaderMaterial{constructor(e){for(const t in super({vertexShader:i,fragmentShader:o,...e}),n)this.uniforms[t]=new v.Uniform(n[t]),Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(e){this.uniforms[t].value=e}});this.uniforms=v.UniformsUtils.clone(this.uniforms)}}).key=v.MathUtils.generateUUID(),a);(0,h.extend)({TrailShaderMaterial:y});let w=({color:e="#004466",waterColor:t="#001a26",foamColor:r="#88ccff",speed:n=1,scale:i=3,opacity:o=.4})=>{let a=(0,l.useRef)(),{nightMode:c}=(0,g.useOcearoContext)(),u=(0,x.useSignalKPath)("steering.autopilot.state"),d=(0,l.useRef)(!1);(0,l.useEffect)(()=>{d.current="auto"===u},[u]),(0,p.useFrame)((e,t)=>{a.current&&(a.current.uniforms.time.value+=t,a.current.uniforms.rainbowActive.value=+!!d.current)});let f=(0,l.useMemo)(()=>new v.Color(c?"#002233":e),[c,e]),m=(0,l.useMemo)(()=>new v.Color(c?"#000811":t),[c,t]),h=(0,l.useMemo)(()=>new v.Color(c?g.oBlue:r),[c,r]);return(0,s.jsxs)("mesh",{rotation:[-Math.PI/2,0,Math.PI/2],position:[0,0,22.5],children:[(0,s.jsx)("planeGeometry",{args:[40,2.2,128,32]}),(0,s.jsx)("trailShaderMaterial",{ref:a,color:f,waterColor:m,foamColor:h,speed:n,scale:i,opacity:o,transparent:!0,depthWrite:!1,blending:v.AdditiveBlending})]})};var M=e.i(15080),b=e.i(99143),S=v,C=e.i(8560);class E extends S.Mesh{constructor(e,t={}){super(e),this.isWater=!0;const r=this,n=void 0!==t.textureWidth?t.textureWidth:512,i=void 0!==t.textureHeight?t.textureHeight:512,o=void 0!==t.clipBias?t.clipBias:0,a=void 0!==t.alpha?t.alpha:1,s=void 0!==t.time?t.time:0,l=void 0!==t.waterNormals?t.waterNormals:null,c=void 0!==t.sunDirection?t.sunDirection:new S.Vector3(.70707,.70707,0),u=new S.Color(void 0!==t.sunColor?t.sunColor:0xffffff),d=new S.Color(void 0!==t.waterColor?t.waterColor:8355711),f=void 0!==t.eye?t.eye:new S.Vector3(0,0,0),m=void 0!==t.distortionScale?t.distortionScale:20,p=void 0!==t.side?t.side:S.FrontSide,h=void 0!==t.fog&&t.fog,v=new S.Plane,g=new S.Vector3,x=new S.Vector3,y=new S.Vector3,w=new S.Matrix4,M=new S.Vector3(0,0,-1),b=new S.Vector4,E=new S.Vector3,_=new S.Vector3,P=new S.Vector4,A=new S.Matrix4,T=new S.PerspectiveCamera,j=new S.WebGLRenderTarget(n,i),L={name:"MirrorShader",uniforms:S.UniformsUtils.merge([C.UniformsLib.fog,C.UniformsLib.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new S.Matrix4},sunColor:{value:new S.Color(8355711)},sunDirection:{value:new S.Vector3(.70707,.70707,0)},eye:{value:new S.Vector3},waterColor:{value:new S.Color(5592405)}}]),vertexShader:`
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
					float rf0 = 0.3;
					float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
					vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
					vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
					vec3 outgoingLight = albedo;
					gl_FragColor = vec4( outgoingLight, alpha );

					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <fog_fragment>	
				}`},R=new S.ShaderMaterial({name:L.name,uniforms:S.UniformsUtils.clone(L.uniforms),vertexShader:L.vertexShader,fragmentShader:L.fragmentShader,lights:!0,side:p,fog:h});R.uniforms.mirrorSampler.value=j.texture,R.uniforms.textureMatrix.value=A,R.uniforms.alpha.value=a,R.uniforms.time.value=s,R.uniforms.normalSampler.value=l,R.uniforms.sunColor.value=u,R.uniforms.waterColor.value=d,R.uniforms.sunDirection.value=c,R.uniforms.distortionScale.value=m,R.uniforms.eye.value=f,r.material=R,r.onBeforeRender=function(e,t,n){if(x.setFromMatrixPosition(r.matrixWorld),y.setFromMatrixPosition(n.matrixWorld),w.extractRotation(r.matrixWorld),g.set(0,0,1),g.applyMatrix4(w),E.subVectors(x,y),E.dot(g)>0)return;E.reflect(g).negate(),E.add(x),w.extractRotation(n.matrixWorld),M.set(0,0,-1),M.applyMatrix4(w),M.add(y),_.subVectors(x,M),_.reflect(g).negate(),_.add(x),T.position.copy(E),T.up.set(0,1,0),T.up.applyMatrix4(w),T.up.reflect(g),T.lookAt(_),T.far=n.far,T.updateMatrixWorld(),T.projectionMatrix.copy(n.projectionMatrix),A.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),A.multiply(T.projectionMatrix),A.multiply(T.matrixWorldInverse),v.setFromNormalAndCoplanarPoint(g,x),v.applyMatrix4(T.matrixWorldInverse),b.set(v.normal.x,v.normal.y,v.normal.z,v.constant);let i=T.projectionMatrix;P.x=(Math.sign(b.x)+i.elements[8])/i.elements[0],P.y=(Math.sign(b.y)+i.elements[9])/i.elements[5],P.z=-1,P.w=(1+i.elements[10])/i.elements[14],b.multiplyScalar(2/b.dot(P)),i.elements[2]=b.x,i.elements[6]=b.y,i.elements[10]=b.z+1-o,i.elements[14]=b.w,f.setFromMatrixPosition(n.matrixWorld);let a=e.getRenderTarget(),s=e.xr.enabled,l=e.shadowMap.autoUpdate;r.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(j),e.state.buffers.depth.setMask(!0),!1===e.autoClear&&e.clear(),e.render(t,T),r.visible=!0,e.xr.enabled=s,e.shadowMap.autoUpdate=l,e.setRenderTarget(a);let c=n.viewport;void 0!==c&&e.state.viewport(c)}}}var _=v;class P extends _.Mesh{constructor(){const e=P.SkyShader,t=new _.ShaderMaterial({name:e.name,uniforms:_.UniformsUtils.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:_.BackSide,depthWrite:!1});super(new _.BoxGeometry(1,1,1),t),this.isSky=!0}}P.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new _.Vector3},up:{value:new _.Vector3(0,1,0)}},vertexShader:`
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
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;

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
			float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
			L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

			gl_FragColor = vec4( retColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};var A=e.i(83934);let T=e=>e===Object(e)&&!Array.isArray(e)&&"function"!=typeof e;function j(e,t){let r=(0,M.useThree)(e=>e.gl),n=(0,b.useLoader)(v.TextureLoader,T(e)?Object.values(e):e);return(0,l.useLayoutEffect)(()=>{null==t||t(n)},[t]),(0,l.useEffect)(()=>{if("initTexture"in r){let e=[];Array.isArray(n)?e=n:n instanceof v.Texture?e=[n]:T(n)&&(e=Object.values(n)),e.forEach(e=>{e instanceof v.Texture&&r.initTexture(e)})}},[r,n]),(0,l.useMemo)(()=>{if(!T(e))return n;{let t={},r=0;for(let i in e)t[i]=n[r++];return t}},[e,n])}j.preload=e=>b.useLoader.preload(v.TextureLoader,e),j.clear=e=>b.useLoader.clear(v.TextureLoader,e);var L=v;let R=parseInt(v.REVISION.replace(/\D+/g,""));class D extends L.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
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
      }`})}}let U=e=>new L.Vector3().setFromSpherical(new L.Spherical(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),O=l.forwardRef(({radius:e=100,depth:t=50,count:r=5e3,saturation:n=0,factor:i=4,fade:o=!1,speed:a=1},s)=>{let c=l.useRef(null),[u,d,f]=l.useMemo(()=>{let o=[],a=[],s=Array.from({length:r},()=>(.5+.5*Math.random())*i),l=new L.Color,c=e+t,u=t/r;for(let e=0;e<r;e++)c-=u*Math.random(),o.push(...U(c).toArray()),l.setHSL(e/r,n,.9),a.push(l.r,l.g,l.b);return[new Float32Array(o),new Float32Array(a),new Float32Array(s)]},[r,t,i,e,n]);(0,p.useFrame)(e=>c.current&&(c.current.uniforms.time.value=e.clock.elapsedTime*a));let[m]=l.useState(()=>new D);return l.createElement("points",{ref:s},l.createElement("bufferGeometry",null,l.createElement("bufferAttribute",{attach:"attributes-position",args:[u,3]}),l.createElement("bufferAttribute",{attach:"attributes-color",args:[d,3]}),l.createElement("bufferAttribute",{attach:"attributes-size",args:[f,1]})),l.createElement("primitive",{ref:c,object:m,attach:"material",blending:L.AdditiveBlending,"uniforms-fade-value":o,depthWrite:!1,transparent:!0,vertexColors:!0}))});var z=e.i(83402);(0,h.extend)({Water:E,Sky:P});let I=function(){let{nightMode:e,setNightMode:t}=(0,g.useOcearoContext)(),{getWindData:r,getCurrentWeather:n}=(0,A.useWeather)(),i=(0,l.useRef)(),o=(0,l.useRef)(),a=(0,l.useRef)(),c=(0,l.useRef)(),u=(0,l.useRef)(null),d=(0,x.useSignalKPath)("navigation.position"),f=(0,l.useRef)(null);(0,l.useEffect)(()=>{f.current=d},[d]);let m=(0,l.useRef)(0),h=(0,M.useThree)(e=>e.gl),y=(0,M.useThree)(e=>e.scene),w=(0,l.useMemo)(()=>new v.Vector3,[]),S=j("assets/moon.jpg"),C=(0,b.useLoader)(v.TextureLoader,"assets/waternormals.jpg");(0,l.useMemo)(()=>{C.wrapS=C.wrapT=v.RepeatWrapping},[C]);let E=(0,l.useMemo)(()=>new v.PlaneGeometry(1e4,1e4,32,32),[]),_=(0,l.useMemo)(()=>({textureWidth:512,textureHeight:512,waterNormals:C,sunDirection:new v.Vector3,sunColor:0xffffff,waterColor:7695,distortionScale:3.7,fog:void 0!==y.fog,format:h.outputColorSpace}),[C,h.outputColorSpace,y.fog]);return(0,p.useFrame)((t,s)=>{let l=f.current,d=l&&"number"==typeof l.latitude?l.latitude:46.15,p=l&&"number"==typeof l.longitude?l.longitude:-1.15,h=new Date,g=z.default.get("debugMode"),x=h;if(g){null===u.current&&(u.current=Date.now());let e=(Date.now()-u.current)/1e3*720%86400,t=Math.floor(e/3600),r=Math.floor(e%3600/60),n=new Date(h.getTime());n.setHours(t,r,0,0),x=n}let y=new Date(x.getFullYear(),0,0),M=x-y+(y.getTimezoneOffset()-x.getTimezoneOffset())*6e4,b=Math.PI/180,S=180/Math.PI,C=x.getHours(),E=x.getMinutes(),_=2*Math.PI/365*(M/864e5-1+(C-12)/24),P=229.18*(75e-6+.001868*Math.cos(_)-.032077*Math.sin(_)-.014615*Math.cos(2*_)-.040849*Math.sin(2*_)),A=.006918-.399912*Math.cos(_)+.070257*Math.sin(_)-.006758*Math.cos(2*_)+907e-6*Math.sin(2*_)-.002697*Math.cos(3*_)+.00148*Math.sin(3*_),T=((60*C+E+(P+4*p- -x.getTimezoneOffset())+1440)%1440/4-180)*b,j=d*b,L=90-Math.acos(Math.min(Math.max(Math.sin(j)*Math.sin(A)+Math.cos(j)*Math.cos(A)*Math.cos(T),-1),1))*S,R=(Math.atan2(Math.sin(T),Math.cos(T)*Math.sin(j)-Math.tan(A)*Math.cos(j))*S+360)%360,D=0;D=L<=-10?1:L>=5?0:(5-L)/15;let U=e||L<=-5,O=U?Math.max(L,20):Math.max(L,5),I=v.MathUtils.degToRad(90-O),B=v.MathUtils.degToRad(R);if(w.setFromSphericalCoords(1,I,B),i.current){let e=r()?.speed??5;m.current+=(e-m.current)*s*.5;let t=Math.min(Math.max(.5*m.current,0),8),n=i.current.material.uniforms;n.distortionScale.value=t,n.sunDirection.value.copy(w).normalize();let o=new v.Color(17510),a=new v.Color(517),l=o.clone().lerp(a,D);n.sunColor.value.setHex(U?4491519:0xffffff),n.waterColor.value.copy(l),n.time.value+=.5*s}if(o.current){let e=o.current.material.uniforms,t=n(),r={turbidity:.5+.5*(t?.humidity??.6),rayleigh:1.2,mieCoefficient:.005,mieDirectionalG:.8},i={turbidity:.05,rayleigh:.1,mieCoefficient:5e-4,mieDirectionalG:.95},a=e=>r[e]+(i[e]-r[e])*D;e.turbidity.value=a("turbidity"),e.rayleigh.value=a("rayleigh"),e.mieCoefficient.value=a("mieCoefficient"),e.mieDirectionalG.value=a("mieDirectionalG"),e.sunPosition.value.copy(w)}c.current&&(c.current.position.copy(w).multiplyScalar(4e3),c.current.visible=!U),a.current&&(a.current.position.copy(w).multiplyScalar(4e3),a.current.visible=U,a.current.lookAt(0,0,0))}),(0,l.useEffect)(()=>{let t=new v.Color(e?517:6694);return y.background=t,y.fog=new v.FogExp2(t,35e-5),h.outputColorSpace=v.SRGBColorSpace,()=>{y.background=null,y.fog=null}},[y,e,h]),(0,s.jsxs)(s.Fragment,{children:[e&&(0,s.jsx)(O,{radius:5e3,depth:50,count:5e3,factor:4,saturation:0,fade:!0,speed:1}),(0,s.jsx)("sky",{ref:o,scale:45e4}),e&&(0,s.jsxs)("mesh",{ref:a,position:[600,200,-1500],children:[(0,s.jsx)("sphereGeometry",{args:[80,32,32]}),(0,s.jsx)("meshStandardMaterial",{map:S,emissive:0xffffff,emissiveIntensity:.8})]}),(0,s.jsxs)("mesh",{ref:c,children:[(0,s.jsx)("sphereGeometry",{args:[200,32,32]}),(0,s.jsx)("meshBasicMaterial",{color:0xffffff})]}),(0,s.jsx)("water",{ref:i,args:[E,_],"rotation-x":-Math.PI/2,position:[0,-.3,0]})]})},B="https://tile.openstreetmap.org/{z}/{x}/{y}.png",V="https://tiles.windy.com/tiles/v10.0/wind/{z}/{x}/{y}.png",G=new Map;async function N(e,t,r,n){let i,o=e.getContext("2d"),{latitude:a,longitude:s}=t,l=(s+180)/360*Math.pow(2,r),c=(1-Math.log(Math.tan(i=a*Math.PI/180)+1/Math.cos(i))/Math.PI)/2*Math.pow(2,r),u=256*l-512,d=256*c-512,f=Math.floor(u/256),m=Math.floor(d/256),p=Math.ceil(4)+2,h=Math.pow(2,r),v=[];for(let e=0;e<p;e++)for(let t=0;t<p;t++){let i=f+t,o=m+e;if(o<0||o>=h)continue;let a=(i%h+h)%h,s=Math.round(256*i-u),l=Math.round(256*o-d),c=n.replace("{z}",r).replace("{x}",a).replace("{y}",o);v.push({url:c,screenLeft:s,screenTop:l})}let g=await Promise.all(v.map(e=>(function(e){if(G.has(e))return G.get(e);let t=new Promise(t=>{let r=new Image;r.crossOrigin="anonymous",r.onload=()=>t(r),r.onerror=()=>t(null),r.src=e});return G.set(e,t),t})(e.url)));o.clearRect(0,0,1024,1024);for(let e=0;e<v.length;e++){let t=g[e];if(!t)continue;let{screenLeft:r,screenTop:n}=v[e];o.drawImage(t,r,n,256,256)}}function F({mode:e="chart"}){let t=(0,l.useRef)(),r=(0,l.useRef)(null),n=(0,l.useRef)(null),i=(0,l.useRef)(!1),o=(0,l.useRef)(null),a=(0,l.useRef)("meteo"===e?V:B),{gl:c}=(0,M.useThree)(),[u,d]=(0,l.useState)(3500),f=(0,x.useSignalKPath)("navigation.position"),m=f?.latitude!=null&&f?.longitude!=null,p=(0,l.useCallback)(()=>{if(i.current||f?.latitude==null||f?.longitude==null)return;let e=o.current;if(e){let t=Math.abs(f.latitude-e.latitude),r=Math.abs(f.longitude-e.longitude);if(t<5e-4&&r<5e-4)return}i.current=!0,o.current=f;let t=r.current,s=n.current;if(!t||!s){i.current=!1;return}let l=Math.max(1,Math.min(18,Math.round(Math.log2(156543.03*Math.cos(f.latitude*Math.PI/180)/9.765625))));d(1024*(156543.03*Math.cos(f.latitude*Math.PI/180)/Math.pow(2,l))/2*.7),N(t,f,l,a.current).then(()=>{s.needsUpdate=!0,i.current=!1})},[f]);(0,l.useEffect)(()=>{let e=document.createElement("canvas");e.width=1024,e.height=1024,r.current=e;let i=new v.CanvasTexture(e);return i.minFilter=v.LinearMipmapLinearFilter,i.magFilter=v.LinearFilter,i.anisotropy=c.capabilities.getMaxAnisotropy(),i.generateMipmaps=!0,n.current=i,t.current&&(t.current.material.map=i,t.current.material.needsUpdate=!0),()=>{i.dispose()}},[c]),(0,l.useEffect)(()=>{if("meteo"===e){a.current=V,p();return}let t=z.default.getAll().signalkUrl||"http://localhost:3000";fetch(`${t}/signalk/v1/api/resources/charts`).then(e=>e.json()).then(e=>{if(!e||"object"!=typeof e)return;let t=Object.values(e),r=t.find(e=>"openstreetmap"!==e.identifier&&e.tilemapUrl)||t.find(e=>e.tilemapUrl);r?.tilemapUrl&&(a.current=r.tilemapUrl.includes("{z}")?r.tilemapUrl:`${r.tilemapUrl}/{z}/{x}/{y}.png`),p()}).catch(()=>{a.current=B,p()})},[e,p]),(0,l.useEffect)(()=>{p()},[f,e]),(0,l.useEffect)(()=>{t.current&&n.current&&(t.current.material.map=n.current,t.current.material.needsUpdate=!0)});let h=(0,l.useMemo)(()=>new v.PlaneGeometry(2*u,2*u),[u]),g=(0,l.useMemo)(()=>new v.MeshBasicMaterial({side:v.DoubleSide,transparent:!1}),[]);return m?(0,s.jsx)("mesh",{ref:t,geometry:h,material:g,rotation:[-Math.PI/2,0,0],position:[0,-.1,0]}):null}var W=e.i(46991),k=e.i(62588);let H=async t=>{try{let r=await e.f({"@/public/boats/default/Scene.jsx":{id:()=>49626,module:()=>e.A(49626)},"@/public/boats/optimist/Scene.jsx":{id:()=>16033,module:()=>e.A(16033)},"@/public/boats/sailboat/Scene.jsx":{id:()=>63912,module:()=>e.A(63912)},"@/public/boats/ship/Scene.jsx":{id:()=>36914,module:()=>e.A(36914)},"@/public/boats/windsurf/Scene.jsx":{id:()=>95548,module:()=>e.A(95548)}}).import(`@/public/boats/${t}/Scene.jsx`);return r.default?r.default:r.Model}catch(e){throw console.error(`Error loading ${t} component:`,e),e}},$=({position:e,visible:t,boatData:r,onClick:n,ref:i})=>{var o;let[a,c]=(0,l.useState)(null),u=0===(o=r.shipType)?"windsurf":30===o?"optimist":36===o?"sailboat":"ship";if((0,l.useEffect)(()=>{let e=!0;return H(u).then(t=>{e&&c(()=>t)}).catch(e=>console.error(`Failed to load ${u}:`,e)),()=>{e=!1}},[u]),!a)return null;let d=Math.max(r.length||10,4)/10;return(0,s.jsx)("group",{ref:i,position:e,visible:t,onClick:e=>{e.stopPropagation(),a&&n&&n(r)},children:(0,s.jsx)(a,{scale:[d,d,d]})})},K=e=>{if(e.isMesh&&e.material)return e;if(e.children?.length)for(let t of e.children){let e=K(t);if(e)return e}return null},Z=({onUpdateInfoPanel:e})=>{let{aisData:t,vesselIds:r}=(0,k.useAIS)(),n=(0,l.useRef)({}),i=(0,l.useRef)({}),[o,a]=(0,l.useState)(null),c=(0,l.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),u=(0,x.useSignalKPaths)(c),d=(0,l.useMemo)(()=>{let e=u["navigation.headingTrue"]||u["navigation.headingMagnetic"],t=u["navigation.courseOverGroundTrue"]||u["navigation.courseOverGroundMagnetic"];return e||t||0},[u]),f=(0,l.useRef)(0);(0,l.useEffect)(()=>{f.current=d},[d]),(0,p.useFrame)(()=>{t&&0!==Object.keys(n.current).length&&Object.entries(n.current).forEach(([e,r])=>{if(!r)return;let n=t[e];if(!n){r.visible=!1;return}if(((e,t,r=!0)=>{let n=-t.rotationAngleY;if(r){e.position.lerp(new v.Vector3(t.sceneX,e.position.y,t.sceneZ),.1);let r=new v.Quaternion().setFromEuler(e.rotation),i=new v.Quaternion().setFromEuler(new v.Euler(0,n,0));r.slerp(i,.1),e.rotation.setFromQuaternion(r)}else e.position.set(t.sceneX,0,t.sceneZ),e.rotation.set(0,n,0)})(r,n,!0),r.visible=n.visible,r.visible){let t=K(r);if(!t)return;if(!i.current[e]){let r=t.material;if(!r)return;i.current[e]={white:r.clone(),red:r.clone(),originalColor:r.color.clone()},i.current[e].white.color.copy(i.current[e].originalColor),i.current[e].red.color.set(g.oRed)}let o=i.current[e],a=r.userData.proximityColor||"white",s=a;"red"===a&&n.distanceMeters>550?s="white":"white"===a&&n.distanceMeters<500&&(s="red"),s!==a?(t.material="red"===s?o.red:o.white,r.userData.proximityColor=s):t.material&&(t.material===o.red||t.material===o.white)||(t.material="red"===a?o.red:o.white)}})},[t]);let m=(0,l.useMemo)(()=>(console.log("Re-rendering boat list"),r.map(e=>e?(0,s.jsx)($,{ref:t=>{t?(t.userData={...t.userData,mmsi:e.mmsi},n.current[e.mmsi]=t):(delete n.current[e.mmsi],delete i.current[e.mmsi])},rotation:[0,-e.rotationAngleY,0],position:[e.sceneX,0,e.sceneZ],visible:e.visible,boatData:e,onClick:e=>{o&&e&&o.mmsi===e.mmsi?a(null):a(e)}},e.mmsi):null).filter(Boolean)),[r,o]),h=(e,t,r="",n=!1,i=!1)=>null==t||""===t||"string"==typeof t&&0===t.trim().length?null:(n&&null!==t&&(t=(0,W.toDegrees)(t)),i&&null!==t&&(t=(0,W.toKnots)(t)),`${e}: ${t}${r}`),y=o?[h("Vessel",o.name),h("MMSI",(e=>{if(!e)return null;let t=String(e);for(let e of["urn:mrn:imo:mmsi:","urn:mrn:signalk:uuid:"])if(t.startsWith(e)){t=t.substring(e.length);break}return t})(o.mmsi)),h("RNG",o.distanceMeters?o.distanceMeters.toFixed(0):0," m"),h("LOA",o.length," m"),h("Type",o.shipType),h("SOG",o.sog," kn",!1,!0),h("COG",o.cog,"°",!0),h("HDG",o.heading,"°",!0),h("Beam",o.beam," m"),h("Draft",o.draft," m"),h("Call",o.callsign),h("Dest",o.destination)].filter(e=>null!==e).join("\n"):"";return(0,l.useEffect)(()=>{e&&e(y)},[y,e]),(0,s.jsx)(s.Fragment,{children:(0,s.jsx)("group",{rotation:[0,f.current,0],children:m})})};var q=e.i(32615),X=e.i(13035),Y=e.i(66799);let Q=({start:e,end:t,color:r,width:n=.2,height:i=.1,dashed:o=!1})=>{let a=(0,l.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?new v.Vector3().addVectors(e,t).multiplyScalar(.5):new v.Vector3,[e,t]),c=(0,l.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?new v.Vector3().subVectors(t,e).normalize():new v.Vector3(0,0,1),[e,t]),u=(0,l.useMemo)(()=>e&&t&&e.isVector3&&t.isVector3?e.distanceTo(t):0,[e,t]),d=(0,l.useMemo)(()=>[0,Math.atan2(c.x,c.z),0],[c]);if(!e||!t||!e.isVector3||!t.isVector3)return null;if(o){let t=Math.floor(u/.7);if(t<=0)return null;let o=[];for(let a=0;a<t;a++){let t=.7*a,l=new v.Vector3().copy(e).add(new v.Vector3().copy(c).multiplyScalar(t+.2));o.push((0,s.jsxs)("mesh",{position:l.toArray(),rotation:d,scale:[n,i,.4],children:[(0,s.jsx)("boxGeometry",{}),(0,s.jsx)("meshStandardMaterial",{color:r})]},a))}return(0,s.jsx)(s.Fragment,{children:o})}return(0,s.jsxs)("mesh",{position:a.toArray(),rotation:d,scale:[n,i,u],children:[(0,s.jsx)("boxGeometry",{}),(0,s.jsx)("meshBasicMaterial",{color:r,transparent:!0,opacity:.6,depthWrite:!1})]})},J=({outerRadius:e=10})=>{let{convertLatLonToXY:t}=(0,g.useOcearoContext)(),r=z.default.get("debugMode"),n=(0,l.useMemo)(()=>["navigation.courseGreatCircle.nextPoint.bearingTrue","navigation.courseGreatCircle.nextPoint.distance","navigation.position"],[]),i=(0,x.useSignalKPaths)(n),[o,a]=(0,l.useState)([]),[c,u]=(0,l.useState)(null);(0,l.useEffect)(()=>{if(r)return;let e=async()=>{try{let e=await Y.default.getWaypoints();if(e){let t=Object.entries(e).map(([e,t])=>{let r=Y.default.parseWaypointPosition(t);return{id:e,name:t.name||"Waypoint",...r}}).filter(e=>e.latitude&&e.longitude);a(t)}let t=await Y.default.getCourse();u(t)}catch(e){console.warn("LayLines3D: Could not fetch navigation data:",e.message)}};e();let t=setInterval(e,3e4);return()=>clearInterval(t)},[r]);let d=i["navigation.courseGreatCircle.nextPoint.bearingTrue"]??v.MathUtils.degToRad(30),f=i["navigation.courseGreatCircle.nextPoint.distance"]??20,m=i["navigation.position"],p=(0,l.useMemo)(()=>new v.Vector3(0,0,0),[]),h=(0,l.useMemo)(()=>{if(r)return new v.Vector3(3,0,-5);if(c?.nextPoint?.position){let e=c.nextPoint.position;if(m?.latitude&&m?.longitude&&e.latitude&&e.longitude){let{x:r,y:n}=t({lat:e.latitude,lon:e.longitude},{lat:m.latitude,lon:m.longitude});return new v.Vector3(.01*r,0,-(.01*n))}}return void 0!==d&&void 0!==f?function(e,t,r=1){return new v.Vector3(e*Math.sin(t)*r,0,-e*Math.cos(t)*r)}(Math.min(.001*f,2*e),d,1):new v.Vector3(0,0,-5)},[r,c,m,d,f,t,e]),y=(0,l.useMemo)(()=>{let e=h.x,t=h.z;return{port:new v.Vector3(0,0,t),starboard:new v.Vector3(e,0,0)}},[h]);return(0,s.jsx)("group",{children:(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(X.Sphere,{position:h.toArray(),args:[.5,16,16],"material-color":g.oYellow,children:[(0,s.jsxs)("mesh",{position:[0,0,0],rotation:[0,Math.PI/2,0],children:[(0,s.jsx)("cylinderGeometry",{args:[.05,.05,1,8]}),(0,s.jsx)("meshStandardMaterial",{color:"black"})]}),(0,s.jsxs)("mesh",{position:[0,0,0],rotation:[Math.PI/2,0,0],children:[(0,s.jsx)("cylinderGeometry",{args:[.05,.05,1,8]}),(0,s.jsx)("meshStandardMaterial",{color:"black"})]})]}),(0,s.jsx)(Q,{start:p,end:y.port,color:g.oGreen,width:.2,height:.1}),(0,s.jsx)(Q,{start:y.port,end:h,color:g.oGreen,width:.2,height:.1}),(0,s.jsx)(Q,{start:p,end:y.starboard,color:g.oRed,width:.2,height:.1}),(0,s.jsx)(Q,{start:y.starboard,end:h,color:g.oRed,width:.2,height:.1})]})})};var ee=e.i(31067),et=v,er=v;let en=new er.Box3,ei=new er.Vector3;class eo extends er.InstancedBufferGeometry{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry",this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute("position",new er.Float32BufferAttribute([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute("uv",new er.Float32BufferAttribute([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,r=this.attributes.instanceEnd;return void 0!==t&&(t.applyMatrix4(e),r.applyMatrix4(e),t.needsUpdate=!0),null!==this.boundingBox&&this.computeBoundingBox(),null!==this.boundingSphere&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let r=new er.InstancedInterleavedBuffer(t,6,1);return this.setAttribute("instanceStart",new er.InterleavedBufferAttribute(r,3,0)),this.setAttribute("instanceEnd",new er.InterleavedBufferAttribute(r,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let r;e instanceof Float32Array?r=e:Array.isArray(e)&&(r=new Float32Array(e));let n=new er.InstancedInterleavedBuffer(r,2*t,1);return this.setAttribute("instanceColorStart",new er.InterleavedBufferAttribute(n,t,0)),this.setAttribute("instanceColorEnd",new er.InterleavedBufferAttribute(n,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new er.WireframeGeometry(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){null===this.boundingBox&&(this.boundingBox=new er.Box3);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;void 0!==e&&void 0!==t&&(this.boundingBox.setFromBufferAttribute(e),en.setFromBufferAttribute(t),this.boundingBox.union(en))}computeBoundingSphere(){null===this.boundingSphere&&(this.boundingSphere=new er.Sphere),null===this.boundingBox&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(void 0!==e&&void 0!==t){let r=this.boundingSphere.center;this.boundingBox.getCenter(r);let n=0;for(let i=0,o=e.count;i<o;i++)ei.fromBufferAttribute(e,i),n=Math.max(n,r.distanceToSquared(ei)),ei.fromBufferAttribute(t,i),n=Math.max(n,r.distanceToSquared(ei));this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(e){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(e)}}var ea=v,es=e.i(31497);class el extends ea.ShaderMaterial{constructor(e){super({type:"LineMaterial",uniforms:ea.UniformsUtils.clone(ea.UniformsUtils.merge([C.UniformsLib.common,C.UniformsLib.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new ea.Vector2(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
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
					#include <${es.version>=154?"colorspace_fragment":"encodings_fragment"}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA="1":delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return"WORLD_UNITS"in this.defines},set:function(e){!0===e?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return"USE_DASH"in this.defines},set(e){!!e!="USE_DASH"in this.defines&&(this.needsUpdate=!0),!0===e?this.defines.USE_DASH="":delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return"USE_ALPHA_TO_COVERAGE"in this.defines},set:function(e){!!e!="USE_ALPHA_TO_COVERAGE"in this.defines&&(this.needsUpdate=!0),!0===e?(this.defines.USE_ALPHA_TO_COVERAGE="",this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}}let ec=es.version>=125?"uv1":"uv2",eu=new et.Vector4,ed=new et.Vector3,ef=new et.Vector3,em=new et.Vector4,ep=new et.Vector4,eh=new et.Vector4,ev=new et.Vector3,eg=new et.Matrix4,ex=new et.Line3,ey=new et.Vector3,ew=new et.Box3,eM=new et.Sphere,eb=new et.Vector4;function eS(e,t,n){return eb.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),eb.multiplyScalar(1/eb.w),eb.x=r/n.width,eb.y=r/n.height,eb.applyMatrix4(e.projectionMatrixInverse),eb.multiplyScalar(1/eb.w),Math.abs(Math.max(eb.x,eb.y))}class eC extends et.Mesh{constructor(e=new eo,t=new el({color:0xffffff*Math.random()})){super(e,t),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,r=e.attributes.instanceEnd,n=new Float32Array(2*t.count);for(let e=0,i=0,o=t.count;e<o;e++,i+=2)ed.fromBufferAttribute(t,e),ef.fromBufferAttribute(r,e),n[i]=0===i?0:n[i-1],n[i+1]=n[i]+ed.distanceTo(ef);let i=new et.InstancedInterleavedBuffer(n,2,1);return e.setAttribute("instanceDistanceStart",new et.InterleavedBufferAttribute(i,1,0)),e.setAttribute("instanceDistanceEnd",new et.InterleavedBufferAttribute(i,1,1)),this}raycast(e,n){let i,o,a=this.material.worldUnits,s=e.camera;null!==s||a||console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let l=void 0!==e.params.Line2&&e.params.Line2.threshold||0;t=e.ray;let c=this.matrixWorld,u=this.geometry,d=this.material;if(r=d.linewidth+l,null===u.boundingSphere&&u.computeBoundingSphere(),eM.copy(u.boundingSphere).applyMatrix4(c),a)i=.5*r;else{let e=Math.max(s.near,eM.distanceToPoint(t.origin));i=eS(s,e,d.resolution)}if(eM.radius+=i,!1!==t.intersectsSphere(eM)){if(null===u.boundingBox&&u.computeBoundingBox(),ew.copy(u.boundingBox).applyMatrix4(c),a)o=.5*r;else{let e=Math.max(s.near,ew.distanceToPoint(t.origin));o=eS(s,e,d.resolution)}ew.expandByScalar(o),!1!==t.intersectsBox(ew)&&(a?function(e,n){let i=e.matrixWorld,o=e.geometry,a=o.attributes.instanceStart,s=o.attributes.instanceEnd,l=Math.min(o.instanceCount,a.count);for(let o=0;o<l;o++){ex.start.fromBufferAttribute(a,o),ex.end.fromBufferAttribute(s,o),ex.applyMatrix4(i);let l=new et.Vector3,c=new et.Vector3;t.distanceSqToSegment(ex.start,ex.end,c,l),c.distanceTo(l)<.5*r&&n.push({point:c,pointOnLine:l,distance:t.origin.distanceTo(c),object:e,face:null,faceIndex:o,uv:null,[ec]:null})}}(this,n):function(e,n,i){let o=n.projectionMatrix,a=e.material.resolution,s=e.matrixWorld,l=e.geometry,c=l.attributes.instanceStart,u=l.attributes.instanceEnd,d=Math.min(l.instanceCount,c.count),f=-n.near;t.at(1,eh),eh.w=1,eh.applyMatrix4(n.matrixWorldInverse),eh.applyMatrix4(o),eh.multiplyScalar(1/eh.w),eh.x*=a.x/2,eh.y*=a.y/2,eh.z=0,ev.copy(eh),eg.multiplyMatrices(n.matrixWorldInverse,s);for(let n=0;n<d;n++){if(em.fromBufferAttribute(c,n),ep.fromBufferAttribute(u,n),em.w=1,ep.w=1,em.applyMatrix4(eg),ep.applyMatrix4(eg),em.z>f&&ep.z>f)continue;if(em.z>f){let e=em.z-ep.z,t=(em.z-f)/e;em.lerp(ep,t)}else if(ep.z>f){let e=ep.z-em.z,t=(ep.z-f)/e;ep.lerp(em,t)}em.applyMatrix4(o),ep.applyMatrix4(o),em.multiplyScalar(1/em.w),ep.multiplyScalar(1/ep.w),em.x*=a.x/2,em.y*=a.y/2,ep.x*=a.x/2,ep.y*=a.y/2,ex.start.copy(em),ex.start.z=0,ex.end.copy(ep),ex.end.z=0;let l=ex.closestPointToPointParameter(ev,!0);ex.at(l,ey);let d=et.MathUtils.lerp(em.z,ep.z,l),m=d>=-1&&d<=1,p=ev.distanceTo(ey)<.5*r;if(m&&p){ex.start.fromBufferAttribute(c,n),ex.end.fromBufferAttribute(u,n),ex.start.applyMatrix4(s),ex.end.applyMatrix4(s);let r=new et.Vector3,o=new et.Vector3;t.distanceSqToSegment(ex.start,ex.end,o,r),i.push({point:o,pointOnLine:r,distance:t.origin.distanceTo(o),object:e,face:null,faceIndex:n,uv:null,[ec]:null})}}}(this,s,n))}}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(eu),this.material.uniforms.resolution.value.set(eu.z,eu.w))}}class eE extends eo{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(e){let t=e.length-3,r=new Float32Array(2*t);for(let n=0;n<t;n+=3)r[2*n]=e[n],r[2*n+1]=e[n+1],r[2*n+2]=e[n+2],r[2*n+3]=e[n+3],r[2*n+4]=e[n+4],r[2*n+5]=e[n+5];return super.setPositions(r),this}setColors(e,t=3){let r=e.length-t,n=new Float32Array(2*r);if(3===t)for(let i=0;i<r;i+=t)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5];else for(let i=0;i<r;i+=t)n[2*i]=e[i],n[2*i+1]=e[i+1],n[2*i+2]=e[i+2],n[2*i+3]=e[i+3],n[2*i+4]=e[i+4],n[2*i+5]=e[i+5],n[2*i+6]=e[i+6],n[2*i+7]=e[i+7];return super.setColors(n,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}}class e_ extends eC{constructor(e=new eE,t=new el({color:0xffffff*Math.random()})){super(e,t),this.isLine2=!0,this.type="Line2"}}let eP=l.forwardRef(function({points:e,color:t=0xffffff,vertexColors:r,linewidth:n,lineWidth:i,segments:o,dashed:a,...s},c){var u,d;let f=(0,M.useThree)(e=>e.size),m=l.useMemo(()=>o?new eC:new e_,[o]),[p]=l.useState(()=>new el),h=(null==r||null==(u=r[0])?void 0:u.length)===4?4:3,g=l.useMemo(()=>{let n=o?new eo:new eE,i=e.map(e=>{let t=Array.isArray(e);return e instanceof v.Vector3||e instanceof v.Vector4?[e.x,e.y,e.z]:e instanceof v.Vector2?[e.x,e.y,0]:t&&3===e.length?[e[0],e[1],e[2]]:t&&2===e.length?[e[0],e[1],0]:e});if(n.setPositions(i.flat()),r){t=0xffffff;let e=r.map(e=>e instanceof v.Color?e.toArray():e);n.setColors(e.flat(),h)}return n},[e,o,r,h]);return l.useLayoutEffect(()=>{m.computeLineDistances()},[e,m]),l.useLayoutEffect(()=>{a?p.defines.USE_DASH="":delete p.defines.USE_DASH,p.needsUpdate=!0},[a,p]),l.useEffect(()=>()=>{g.dispose(),p.dispose()},[g]),l.createElement("primitive",(0,ee.default)({object:m,ref:c},s),l.createElement("primitive",{object:g,attach:"geometry"}),l.createElement("primitive",(0,ee.default)({object:p,attach:"material",color:t,vertexColors:!!r,resolution:[f.width,f.height],linewidth:null!=(d=null!=n?n:i)?d:1,dashed:a,transparent:4===h},s)))});var eA=e.i(96162);let eT={DEG2RAD:Math.PI/180,ROTATION_INTERPOLATION_FACTOR:.05,SOG_SMOOTHING_FACTOR:.1,DEFAULT_SOG:3,ANGLE_INCREMENT:10,SPHERE_SIZE:.4,SPHERE_SEGMENTS:32,PLOTS_COUNT:5,FRAME_TO_MINUTE_RATIO:3600},ej=(e,t)=>.44704*e*60*t*.1,eL=(e,t,r)=>{if(!e||!t)return new v.Vector3(0,0,0);let n=e*eT.DEG2RAD,i=ej(t,r);return new v.Vector3(i*Math.sin(n),0,-i*Math.cos(n))},eR=({position:e,color:t})=>e?(0,s.jsxs)("mesh",{position:e,children:[(0,s.jsx)("sphereGeometry",{args:[eT.SPHERE_SIZE,eT.SPHERE_SEGMENTS,eT.SPHERE_SEGMENTS]}),(0,s.jsx)("meshBasicMaterial",{color:t,transparent:!0,opacity:.8})]}):null,eD=({points:e,color:t})=>e?.length?(0,s.jsx)(eP,{points:e,color:t,lineWidth:2,transparent:!0,opacity:.5}):null,eU=l.default.memo(({timeInMinute:e,windSpeed:t})=>{let r=(0,l.useRef)(eA.default.vpp),n=(0,l.useCallback)((e,t,r,n)=>{if(!e?.length||!t?.length||e.length<=r||t.length<=r)return console.warn("Invalid angle or VMG data"),null;let i=e[r],o=t[r],a=i*eT.DEG2RAD,s=ej(o,n);return new v.Vector3(s*Math.sin(a),0,-s*Math.cos(a))},[]),i=(0,l.useCallback)((e,t)=>{let{speeds:n,angles:i,beat_angle:o,beat_vmg:a,run_angle:s,run_vmg:l}=r.current;if(!n?.length||!i?.length)return console.warn("Invalid polar data"),null;let c=[],u=(e,r,n)=>{for(let i=e;i<=r;i+=eT.ANGLE_INCREMENT)c.push(eL(i,n(i),t))};u(0,o[e]-eT.ANGLE_INCREMENT,t=>{let r;return r=a[e],0+t/o[e]*(r-0)});let d=eL(o[e],a[e],t);c.push(d),i.forEach(n=>{if(n>o[e]&&n<s[e]){let i=r.current[Math.floor(n)]?.[e]||0;c.push(eL(n,i,t))}});let f=eL(s[e],l[e],t);return c.push(f),u(s[e]+eT.ANGLE_INCREMENT,180,()=>l[e]),new v.CatmullRomCurve3(c,!0)},[]),o=(0,l.useMemo)(()=>{let o=r.current;if(!o?.speeds?.length)return console.warn("Invalid polar data structure"),{curve:null,beat:null,run:null};let a=((e,t)=>{if(!e?.length)return 0;let r=0,n=e.length-1;for(;r<n;){let i=Math.floor((r+n)/2);e[i]<t?r=i+1:n=i}return r})(o.speeds,t);return{curve:i(a,e),beat:n(o.beat_angle,o.beat_vmg,a,e),run:n(o.run_angle,o.run_vmg,a,e)}},[e,t,n,i]),a=[0,-Math.PI];return(0,s.jsx)(s.Fragment,{children:a.map((e,t)=>(0,s.jsxs)("group",{position:[0,-.7,0],rotation:[0,0,e],children:[o.curve&&(0,s.jsx)(eD,{points:o.curve.getPoints(100),color:g.oBlue}),(0,s.jsx)(eR,{position:o.beat,color:g.oGreen}),(0,s.jsx)(eR,{position:o.run,color:g.oRed})]},t))})});eU.displayName="PolarPlot";let eO=function(){let e=(0,l.useRef)([]),[t,r]=(0,l.useState)([]),n=(0,l.useRef)(0),i=(0,l.useRef)([]),o=(0,l.useRef)(eT.DEFAULT_SOG),a=z.default.get("preferredWindSpeedPath")||"speedTrue",c=z.default.get("preferredWindDirectionPath")||"angleTrueWater",u=(0,l.useMemo)(()=>[`environment.wind.${c}`,`environment.wind.${a}`,"environment.wind.angleTrueWater","environment.wind.angleTrueGround","environment.wind.speedTrue","environment.wind.speedOverGround","environment.wind.angleApparent","environment.wind.speedApparent","navigation.speedOverGround","navigation.headingTrue","navigation.courseOverGroundTrue"],[c,a]),d=(0,x.useSignalKPaths)(u),f=(0,l.useMemo)(()=>{let e=d["environment.wind.angleApparent"],t=d["environment.wind.speedApparent"];if(null!=e&&null!=t&&t>0)return-e;if("directionTrue"===c){let e=d["environment.wind.directionTrue"];if(null!=e)return-(e-(d["navigation.headingTrue"]??d["navigation.courseOverGroundTrue"]??0));let t=d["environment.wind.angleTrueGround"]??d["environment.wind.angleTrueWater"];return null!=t?-t:0}let r=d[`environment.wind.${c}`]??d["environment.wind.angleTrueWater"]??d["environment.wind.angleTrueGround"];return null!=r?-r:0},[d,c]),m=(0,l.useMemo)(()=>{let e=d[`environment.wind.${a}`]??d["environment.wind.speedTrue"]??d["environment.wind.speedOverGround"];return(0,W.convertWindSpeed)(e)||0},[d,a]),h=d["navigation.speedOverGround"]||eT.DEFAULT_SOG,g=(0,l.useRef)(m),[y,w]=(0,l.useState)(Date.now()),M=(0,l.useRef)(null);return(0,l.useEffect)(()=>{let t=Array.from({length:eT.PLOTS_COUNT},(e,t)=>({id:t,timeInMinute:5*(t+1)}));return r(t),e.current=t.map(()=>new v.Group),i.current=Array(eT.PLOTS_COUNT).fill(0),M.current=setInterval(()=>{w(Date.now()),n.current=0},12e4),()=>{M.current&&clearInterval(M.current)}},[]),(0,l.useEffect)(()=>{Math.abs(g.current-m)>5&&(w(Date.now()),n.current=0,g.current=m)},[m]),(0,p.useFrame)(()=>{n.current+=1,o.current=v.MathUtils.lerp(o.current,h,eT.SOG_SMOOTHING_FACTOR),t.forEach((t,r)=>{let o=e.current[r];if(o&&t.timeInMinute-n.current/eT.FRAME_TO_MINUTE_RATIO>0){let e=i.current[r],t=v.MathUtils.lerp(e,f,eT.ROTATION_INTERPOLATION_FACTOR);o.rotation.set(0,t,0),i.current[r]=t}})}),(0,s.jsx)(s.Fragment,{children:t.map((t,r)=>(0,s.jsx)("group",{ref:t=>{t&&(e.current[r]=t)},children:(0,s.jsx)(eU,{timeInMinute:t.timeInMinute,windSpeed:m},`plot-${y}-${r}`)},`${t.id}-${y}`))})},ez=()=>{let{states:e,nightMode:t}=(0,g.useOcearoContext)(),r=t?.3:.5;return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)("ambientLight",{intensity:t?.2:.4}),(0,s.jsx)("directionalLight",{position:[0,70,-100],intensity:t?.6:1.2,castShadow:!1,color:t?"#b0d8ff":"#ffffff"}),(0,s.jsx)("spotLight",{position:[0,50,100],intensity:2*r,angle:.6,penumbra:1,color:t?"#4080ff":"#ffffff"}),(0,s.jsx)("pointLight",{position:[0,40,-80],intensity:2.5*r,distance:150,decay:2}),(0,s.jsx)("pointLight",{position:[0,30,100],intensity:.8*r,distance:120,decay:2})]})},eI={mainCar:.5,jibCar:.5,tension:.5,reefLevel:0};var eB=e.i(5941),eV=e.i(16196);let eG="#333333",eN="#222222",eF=[{label:"GV",centerDeg:180,color:"#09bfff",key:"mainCar",mode:"position"},{label:"FP",centerDeg:260,color:"#15bd6f",key:"jibCar",side:"port",mode:"fill"},{label:"FS",centerDeg:100,color:"#bf1515",key:"jibCar",side:"starboard",mode:"fill"}];function eW(e,t){let r=v.MathUtils.degToRad(e-90);return[t*Math.cos(r),t*Math.sin(r)]}let ek=({label:e,value:t,centerDeg:r,color:n})=>{let i=Math.max(0,Math.min(1,t)),o=(0,l.useMemo)(()=>{let e=[],t=r-15;for(let r=0;r<=12;r++){let o=r/12,[a,l]=eW(t+30*o,4.2),c=Math.abs(o-i),u=c<=.041666666666666664,d=c<=.125,f=.041666666666666664>=Math.abs(o-.5),m=eG,p=.09,h=.3;u?(m=n,p=.16,h=1):d?(m=n,p=.09,h=.5):f&&(h=.5),e.push((0,s.jsx)(X.Sphere,{args:[p,8,8],position:[a,0,l],children:(0,s.jsx)("meshBasicMaterial",{color:m,transparent:!0,opacity:h})},r))}return e},[i,r,n]),a=v.MathUtils.degToRad(r-90),c=3.6*Math.cos(a),u=3.6*Math.sin(a);return(0,s.jsxs)("group",{children:[o,(0,s.jsx)(eV.Text,{position:[c,-.4,u],color:n,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-a],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e})]})},eH=({label:e,value:t,centerDeg:r,color:n,active:i})=>{let o=Math.max(0,Math.min(1,t)),a=(0,l.useMemo)(()=>{let e=[],t=r-15;for(let r=0;r<=12;r++){let a=r/12,[l,c]=eW(t+30*a,4.2),u=eN,d=.09,f=.15;if(i){let e=a<=o;.041666666666666664>=Math.abs(a-o)?(u=n,d=.16,f=1):e?(u=n,f=.7):(u=eG,f=.3)}e.push((0,s.jsx)(X.Sphere,{args:[d,8,8],position:[l,0,c],children:(0,s.jsx)("meshBasicMaterial",{color:u,transparent:!0,opacity:f})},r))}return e},[o,r,n,i]),c=v.MathUtils.degToRad(r-90),u=3.6*Math.cos(c),d=3.6*Math.sin(c);return(0,s.jsxs)("group",{children:[a,(0,s.jsx)(eV.Text,{position:[u,-.4,d],color:i?n:eN,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-c],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:i?.9:.2,children:e})]})},e$=()=>{let e=(0,x.useSignalKPath)("environment.wind.angleApparent",0),t=(0,x.useSignalKPath)("environment.wind.speedApparent",0),r=(0,l.useMemo)(()=>{let t=e;for(;t<0;)t+=2*Math.PI;for(;t>=2*Math.PI;)t-=2*Math.PI;return t>Math.PI},[e]),{mainCar:n,jibCar:i}=(0,l.useMemo)(()=>(function(e,t){let r=e;for(;r<0;)r+=2*Math.PI;for(;r>=2*Math.PI;)r-=2*Math.PI;let n=r>Math.PI,i=Math.max(0,1-(n?2*Math.PI-r:r)/(.75*Math.PI)),o=Math.min(1,Math.abs(t)/15),a=(1-i)*.4*o;return{mainCar:n?.5-a:.5+a,jibCar:Math.max(.05,Math.min(1,(1-i)*.7+.2*o+.1))}})(e,t),[e,t]);return(0,s.jsx)("group",{children:eF.map(e=>{let t="mainCar"===e.key?n:i,o=!0;return("port"===e.side&&(o=!r),"starboard"===e.side&&(o=r),"position"===e.mode)?(0,s.jsx)(ek,{label:e.label,value:t,centerDeg:e.centerDeg,color:e.color},e.label):(0,s.jsx)(eH,{label:e.label,value:t,centerDeg:e.centerDeg,color:e.color,active:o},e.label)})})};e.s(["default",0,({onUpdateInfoPanel:e})=>{let{states:t}=(0,g.useOcearoContext)(),r=(0,l.useRef)(),n=z.default.get("debugShowAxes"),i=(()=>{let[e,t]=(0,l.useState)(eI),r=z.default.get("preferredWindSpeedPath")||"speedTrue",n=z.default.get("preferredWindDirectionPath")||"angleTrueWater",i=(0,l.useMemo)(()=>[`environment.wind.${r}`,`environment.wind.${n}`,"environment.wind.speedTrue","environment.wind.angleTrueWater","environment.wind.angleApparent","environment.wind.speedApparent"],[r,n]),o=(0,x.useSignalKPaths)(i),a=o[`environment.wind.${r}`]??o["environment.wind.speedTrue"]??0,s=o[`environment.wind.${n}`]??o["environment.wind.angleTrueWater"]??0,c=o["environment.wind.angleApparent"]??0,u=o["environment.wind.speedApparent"]??0,d=(0,l.useCallback)((e,r)=>{t(t=>({...t,[e]:r}))},[]),f=(0,l.useCallback)(e=>{d("mainCar",e)},[d]),m=(0,l.useCallback)(e=>{d("jibCar",e)},[d]),p=(0,l.useCallback)(e=>{d("tension",e)},[d]),h=(0,l.useCallback)(e=>{let t=1.9438444924574*e;return t>25?2:+(t>18)},[]),v=(0,l.useMemo)(()=>h(a),[a,h]),g=(0,l.useMemo)(()=>({tws:a,twa:s,awa:c,aws:u}),[a,s,c,u]),y=(0,l.useMemo)(()=>({...e,reefLevel:v,...g}),[e,v,g]);return{trimState:e,windData:g,reefLevel:v,sailTrimParams:y,setMainCar:f,setJibCar:m,setTension:p,setTrimValue:d}})(),o=(0,l.useMemo)(()=>({...(0,eB.updateSailTrim)({tws:i.windData.tws,twa:i.windData.twa,awa:i.windData.awa,mainCar:i.trimState.mainCar,jibCar:i.trimState.jibCar,tension:i.trimState.tension}),trimState:i.trimState}),[i.windData,i.trimState]);return(0,s.jsxs)(l.Suspense,{fallback:(0,s.jsx)(d.Html,{children:"Loading..."}),children:[(0,s.jsx)(u.PerspectiveCamera,{makeDefault:!0,fov:60,near:5,far:500,position:[0,5,20]}),(0,s.jsx)(c.OrbitControls,{enableZoom:!0,enableRotate:!0,maxPolarAngle:Math.PI/2,minPolarAngle:Math.PI/4,enableDamping:!1,zoomSpeed:.5,rotateSpeed:.5}),(0,s.jsx)(f.Environment,{files:"./assets/ocearo_env.hdr",background:!1,intensity:.8,resolution:256}),(0,s.jsx)(ez,{}),(0,s.jsxs)("group",{position:[0,-3,0],children:[(0,s.jsx)(m.default,{position:[0,0,0],scale:[.7,.7,.7],ref:r,showSail:!0,onUpdateInfoPanel:e,sailTrimData:o}),"water"===t.oceanMode&&(0,s.jsx)(I,{}),"chart"===t.oceanMode&&(0,s.jsx)(F,{mode:"chart"}),"meteo"===t.oceanMode&&(0,s.jsx)(F,{mode:"meteo"}),(0,s.jsx)(w,{}),t.showLaylines3D&&(0,s.jsx)(J,{outerRadius:5.6}),t.showPolar&&"black"===t.oceanMode&&(0,s.jsx)(eO,{}),t.ais&&(0,s.jsx)(k.AISProvider,{children:(0,s.jsx)(Z,{onUpdateInfoPanel:e})}),(0,s.jsx)(q.default,{visible:!0}),!1!==z.default.get("showSailTrimSliders")&&(0,s.jsx)(e$,{})]}),n&&(0,s.jsx)("axesHelper",{args:[100]})]})}],67225)},59465,e=>{e.n(e.i(67225))}]);