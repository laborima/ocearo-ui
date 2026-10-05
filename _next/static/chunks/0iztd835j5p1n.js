(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,67225,e=>{"use strict";var t=e.i(43476),a=e.i(71645),r=e.i(30297),o=e.i(82897),i=e.i(60099),n=e.i(66326),s=e.i(80566),l=e.i(90874),u=e.i(93282),c=e.i(95393),d=e.i(90072),m=d,h=e.i(8560);class f extends m.Mesh{constructor(e,t={}){super(e),this.isWater=!0;const a=this,r=void 0!==t.textureWidth?t.textureWidth:512,o=void 0!==t.textureHeight?t.textureHeight:512,i=void 0!==t.clipBias?t.clipBias:0,n=void 0!==t.alpha?t.alpha:1,s=void 0!==t.time?t.time:0,l=void 0!==t.waterNormals?t.waterNormals:null,u=void 0!==t.sunDirection?t.sunDirection:new m.Vector3(.70707,.70707,0),c=new m.Color(void 0!==t.sunColor?t.sunColor:0xffffff),d=new m.Color(void 0!==t.waterColor?t.waterColor:8355711),f=void 0!==t.eye?t.eye:new m.Vector3(0,0,0),p=void 0!==t.distortionScale?t.distortionScale:20,v=void 0!==t.side?t.side:m.FrontSide,g=void 0!==t.fog&&t.fog,x=new m.Plane,y=new m.Vector3,M=new m.Vector3,b=new m.Vector3,w=new m.Matrix4,S=new m.Vector3(0,0,-1),C=new m.Vector4,j=new m.Vector3,P=new m.Vector3,T=new m.Vector4,k=new m.Matrix4,D=new m.PerspectiveCamera,F=new m.WebGLRenderTarget(r,o,{type:m.HalfFloatType}),R={name:"MirrorShader",uniforms:m.UniformsUtils.merge([h.UniformsLib.fog,h.UniformsLib.lights,{normalSampler:{value:null},mirrorSampler:{value:null},alpha:{value:1},time:{value:0},size:{value:1},distortionScale:{value:20},textureMatrix:{value:new m.Matrix4},sunColor:{value:new m.Color(8355711)},sunDirection:{value:new m.Vector3(.70707,.70707,0)},eye:{value:new m.Vector3},waterColor:{value:new m.Color(5592405)}}]),vertexShader:`
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
				}`},z=new m.ShaderMaterial({name:R.name,uniforms:m.UniformsUtils.clone(R.uniforms),vertexShader:R.vertexShader,fragmentShader:R.fragmentShader,lights:!0,side:v,fog:g});z.uniforms.mirrorSampler.value=F.texture,z.uniforms.textureMatrix.value=k,z.uniforms.alpha.value=n,z.uniforms.time.value=s,z.uniforms.normalSampler.value=l,z.uniforms.sunColor.value=c,z.uniforms.waterColor.value=d,z.uniforms.sunDirection.value=u,z.uniforms.distortionScale.value=p,z.uniforms.eye.value=f,a.material=z,a.onBeforeRender=function(e,t,r){if(M.setFromMatrixPosition(a.matrixWorld),b.setFromMatrixPosition(r.matrixWorld),w.extractRotation(a.matrixWorld),y.set(0,0,1),y.applyMatrix4(w),j.subVectors(M,b),j.dot(y)>0)return;j.reflect(y).negate(),j.add(M),w.extractRotation(r.matrixWorld),S.set(0,0,-1),S.applyMatrix4(w),S.add(b),P.subVectors(M,S),P.reflect(y).negate(),P.add(M),D.position.copy(j),D.up.set(0,1,0),D.up.applyMatrix4(w),D.up.reflect(y),D.lookAt(P),D.far=r.far,D.updateMatrixWorld(),D.projectionMatrix.copy(r.projectionMatrix),k.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),k.multiply(D.projectionMatrix),k.multiply(D.matrixWorldInverse),x.setFromNormalAndCoplanarPoint(y,M),x.applyMatrix4(D.matrixWorldInverse),C.set(x.normal.x,x.normal.y,x.normal.z,x.constant);let o=D.projectionMatrix;T.x=(Math.sign(C.x)+o.elements[8])/o.elements[0],T.y=(Math.sign(C.y)+o.elements[9])/o.elements[5],T.z=-1,T.w=(1+o.elements[10])/o.elements[14],C.multiplyScalar(2/C.dot(T)),o.elements[2]=C.x,o.elements[6]=C.y,o.elements[10]=C.z+1-i,o.elements[14]=C.w,f.setFromMatrixPosition(r.matrixWorld);let n=e.getRenderTarget(),s=e.xr.enabled,l=e.shadowMap.autoUpdate;a.visible=!1,e.xr.enabled=!1,e.shadowMap.autoUpdate=!1,e.setRenderTarget(F),e.state.buffers.depth.setMask(!0),!1===e.autoClear&&e.clear(),e.render(t,D),a.visible=!0,e.xr.enabled=s,e.shadowMap.autoUpdate=l,e.setRenderTarget(n);let u=r.viewport;void 0!==u&&e.state.viewport(u)}}}var p=d;class v extends p.Mesh{constructor(){const e=v.SkyShader,t=new p.ShaderMaterial({name:e.name,uniforms:p.UniformsUtils.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:p.BackSide,depthWrite:!1});super(new p.BoxGeometry(1,1,1),t),this.isSky=!0}}v.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new p.Vector3},cloudScale:{value:2e-4},cloudSpeed:{value:2e-5},cloudCoverage:{value:.4},cloudDensity:{value:.4},cloudElevation:{value:.5},showSunDisc:{value:1},time:{value:0}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;

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

			vSunE = sunIntensity( vSunDirection.y );

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
		uniform float cloudScale;
		uniform float cloudSpeed;
		uniform float cloudCoverage;
		uniform float cloudDensity;
		uniform float cloudElevation;
		uniform float showSunDisc;
		uniform float time;

		// gradient at a lattice corner; sinless hash so every GPU produces the same clouds
		vec2 gradient( vec2 i ) {
			vec3 p = fract( i.xyx * vec3( 0.1031, 0.1030, 0.0973 ) );
			p += dot( p, p.yzx + 33.33 );
			return fract( ( p.xx + p.yz ) * p.zy ) * 2.0 - 1.0;
		}

		// 2D gradient noise: isotropic lobes like Perlin at value-noise cost
		float noise( vec2 p ) {
			vec2 i = floor( p );
			vec2 f = fract( p );
			vec2 u = f * f * f * ( f * ( f * 6.0 - 15.0 ) + 10.0 ); // quintic fade
			float a = dot( gradient( i ), f );
			float b = dot( gradient( i + vec2( 1.0, 0.0 ) ), f - vec2( 1.0, 0.0 ) );
			float c = dot( gradient( i + vec2( 0.0, 1.0 ) ), f - vec2( 0.0, 1.0 ) );
			float d = dot( gradient( i + vec2( 1.0, 1.0 ) ), f - vec2( 1.0, 1.0 ) );
			return mix( mix( a, b, u.x ), mix( c, d, u.x ), u.y ) * 1.6; // ~[-1,1]
		}

		// fbm; per-octave drift makes clouds billow instead of scrolling as a rigid stamp
		float fbm( vec2 p, float drift ) {
			float result = 0.0;
			float amplitude = 1.0;
			for ( int i = 0; i < 4; i ++ ) {
				result += amplitude * noise( p );
				amplitude *= 0.5;
				p = p * 2.0 + drift;
			}
			return result;
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
			float zenithAngle = acos( max( 0.0, direction.y ) );
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
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - vSunDirection.y, 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisc = clamp( ( cosTheta - sunAngularDiameterCos ) * 50000.0, 0.0, 1.0 ) * showSunDisc;
			vec3 sundiscColor = ( 760.0 * sundisc ) * min( vSunE * Fex, 80.0 );

			vec3 texColor = ( Lin + L0 ) * 0.04 + sundiscColor + vec3( 0.0, 0.0003, 0.00075 );

			// Clouds
			if ( direction.y > 0.0 && cloudCoverage > 0.0 ) {

				// Project to cloud plane (higher elevation = clouds appear lower/closer)
				float elevation = mix( 1.0, 0.1, cloudElevation );
				vec2 cloudUV = direction.xz / ( direction.y * elevation );
				cloudUV *= cloudScale;
				cloudUV += time * cloudSpeed;

				// Cloud density field
				float evolve = time * cloudSpeed * 300.0;
				float cloudNoise = clamp( fbm( cloudUV * 1000.0, evolve ) * 0.7 + 0.5, 0.0, 1.0 );

				// Large-scale coverage variation: clear gaps next to dense banks
				float region = noise( cloudUV * 300.0 ) * 0.37 + 0.5;
				float cov = clamp( cloudCoverage + ( region - 0.5 ) * 0.6, 0.0, 1.0 );

				// Carve clouds where noise rises above the coverage level
				float threshold = 1.0 - cov;
				float cloudMask = smoothstep( threshold, threshold + 0.3, cloudNoise );

				// Fade clouds near horizon (adjusted by elevation)
				float horizonFade = smoothstep( 0.0, 0.03 + 0.06 * cloudElevation, direction.y );
				cloudMask *= horizonFade;

				// Cloud lighting from the sky's own radiance
				float dayFactor = smoothstep( -0.08, 0.3, vSunDirection.y );
				vec3 sunColor = vSunE * Fex * 0.22 * 0.04; // 0.22 ~ albedo/pi, 0.04 = exposure; the aerial composite adds the eye-leg extinction
				vec3 skyAmbient = Lin * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

				// Beer-powder self-shadow from the sampled density
				float depth = max( 0.0, cloudNoise - threshold );
				float beer = exp( depth * -4.0 );
				float powder = 1.0 - beer * beer; // beer*beer == exp(-8*depth)
				float shade = mix( 0.45, 1.0, clamp( beer * powder * 2.6, 0.0, 1.0 ) ); // 2.6 = 1/0.385, normalizes beer*powder peak to 1

				// Henyey-Greenstein forward lobe ( g = 0.7 ): silver lining on rims toward the sun
				float silver = clamp( 0.51 / pow( 1.49 - cosTheta * 1.4, 1.5 ), 0.0, 3.0 ); // 0.51=1-g^2, 1.49=1+g^2, 1.4=2g
				float edge = cloudMask * ( 1.0 - cloudMask ) * 4.0;

				vec3 cloudColor = skyAmbient + sunColor * shade;
				cloudColor += sunColor * silver * edge * 0.6;
				cloudColor *= max( dayFactor, 0.03 );

				// Cloud opacity via Beer's law: density sets how solid the clouds get
				float alpha = ( 1.0 - exp( depth * cloudDensity * -12.0 ) ) * horizonFade;

				// Occlude the sun disc/glow behind opaque cloud
				texColor -= L0 * 0.04 * alpha;

				// Composite through the atmosphere so distant clouds dissolve into haze
				vec3 cloudAerial = mix( texColor, cloudColor, Fex );
				texColor = mix( texColor, cloudAerial, alpha );

			}

			gl_FragColor = vec4( texColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};var g=e.i(67561),x=e.i(83934),y=e.i(85709);let M=e=>e===Object(e)&&!Array.isArray(e)&&"function"!=typeof e;function b(e,t){let r=(0,l.useThree)(e=>e.gl),o=(0,u.useLoader)(d.TextureLoader,M(e)?Object.values(e):e);return(0,a.useLayoutEffect)(()=>{null==t||t(o)},[t]),(0,a.useEffect)(()=>{if("initTexture"in r){let e=[];Array.isArray(o)?e=o:o instanceof d.Texture?e=[o]:M(o)&&(e=Object.values(o)),e.forEach(e=>{e instanceof d.Texture&&r.initTexture(e)})}},[r,o]),(0,a.useMemo)(()=>{if(!M(e))return o;{let t={},a=0;for(let r in e)t[r]=o[a++];return t}},[e,o])}b.preload=e=>u.useLoader.preload(d.TextureLoader,e),b.clear=e=>u.useLoader.clear(d.TextureLoader,e);var w=d;let S=parseInt(d.REVISION.replace(/\D+/g,""));class C extends w.ShaderMaterial{constructor(){super({uniforms:{time:{value:0},fade:{value:1}},vertexShader:`
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
	      #include <${S>=154?"colorspace_fragment":"encodings_fragment"}>
      }`})}}let j=e=>new w.Vector3().setFromSpherical(new w.Spherical(e,Math.acos(1-2*Math.random()),2*Math.random()*Math.PI)),P=a.forwardRef(({radius:e=100,depth:t=50,count:r=5e3,saturation:o=0,factor:i=4,fade:n=!1,speed:s=1},l)=>{let u=a.useRef(null),[d,m,h]=a.useMemo(()=>{let a=[],n=[],s=Array.from({length:r},()=>(.5+.5*Math.random())*i),l=new w.Color,u=e+t,c=t/r;for(let e=0;e<r;e++)u-=c*Math.random(),a.push(...j(u).toArray()),l.setHSL(e/r,o,.9),n.push(l.r,l.g,l.b);return[new Float32Array(a),new Float32Array(n),new Float32Array(s)]},[r,t,i,e,o]);(0,c.useFrame)(e=>u.current&&(u.current.uniforms.time.value=e.clock.elapsedTime*s));let[f]=a.useState(()=>new C);return a.createElement("points",{ref:l},a.createElement("bufferGeometry",null,a.createElement("bufferAttribute",{attach:"attributes-position",args:[d,3]}),a.createElement("bufferAttribute",{attach:"attributes-color",args:[m,3]}),a.createElement("bufferAttribute",{attach:"attributes-size",args:[h,1]})),a.createElement("primitive",{ref:u,object:f,attach:"material",blending:w.AdditiveBlending,"uniforms-fade-value":n,depthWrite:!1,transparent:!0,vertexColors:!0}))});var T=e.i(83402),k=e.i(95430),D=e.i(14421);(0,s.extend)({Water:f,Sky:v});let F=new d.Color(17510),R=new d.Color(517),z=new d.Color,E=new d.Color,A=function({lite:e=!1,fogDensity:r=35e-5,water:o=!0,sky:i=!0,horizon:n,liteColor:s=0xb4cbd1}){let{nightMode:m}=(0,g.useOcearoContext)(),{getWindData:h,getCurrentWeather:p}=(0,x.useWeather)(),v=(0,a.useRef)(),M=(0,a.useRef)(),w=(0,a.useRef)(),S=(0,a.useRef)(),C=(0,a.useRef)(null),j=(0,y.useSignalKPath)("navigation.position"),A=(0,a.useRef)(null);(0,a.useEffect)(()=>{A.current=j},[j]);let I=(0,a.useRef)(0),W=(0,a.useRef)(1),G=(0,l.useThree)(e=>e.gl),N=(0,l.useThree)(e=>e.scene),L=(0,a.useMemo)(()=>new d.Vector3,[]),B=b("assets/moon.jpg"),_=(0,u.useLoader)(d.TextureLoader,"assets/waternormals.jpg");(0,a.useMemo)(()=>{_.wrapS=_.wrapT=d.RepeatWrapping},[_]);let O=(0,a.useMemo)(()=>new d.PlaneGeometry(4e3,4e3,144,144),[]),U=(0,a.useMemo)(()=>new d.MeshBasicMaterial({color:0xb4cbd1,depthWrite:!1}),[]),V=(0,a.useMemo)(()=>new d.Color(s),[s]),H=(0,a.useRef)({waveAmp:{value:0},waveTime:{value:0}}),Z=(0,a.useRef)(),$=(0,a.useRef)(),K=(0,a.useRef)(!1),X=(0,a.useMemo)(()=>{let e=document.createElement("canvas");e.width=e.height=128;let t=e.getContext("2d"),a=t.createRadialGradient(64,64,8,64,64,62);return a.addColorStop(0,"rgba(255,255,255,0.85)"),a.addColorStop(.55,"rgba(255,255,255,0.35)"),a.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=a,t.fillRect(0,0,128,128),new d.CanvasTexture(e)},[]),Y=(0,a.useMemo)(()=>{let e=[];for(let t=0;t<16;t++){let a=t/16*Math.PI*2+.6*Math.random(),r=500+1200*Math.random();e.push({position:[Math.cos(a)*r,260+180*Math.random(),Math.sin(a)*r],scale:[420+380*Math.random(),150+120*Math.random(),1]})}return e},[]),q=(0,a.useMemo)(()=>new d.SpriteMaterial({map:X,transparent:!0,opacity:0,depthWrite:!1,color:0xffffff}),[X]),J=(0,a.useMemo)(()=>{let e=new Float32Array(3600);for(let t=0;t<1200;t++)e[3*t]=(2*Math.random()-1)*240,e[3*t+1]=220*Math.random(),e[3*t+2]=(2*Math.random()-1)*240;let t=new d.BufferGeometry;return t.setAttribute("position",new d.BufferAttribute(e,3)),t},[]),Q=(0,a.useMemo)(()=>new d.PointsMaterial({color:0x9fc4d8,size:1.6,transparent:!0,opacity:.55,depthWrite:!1,sizeAttenuation:!0}),[]),ee=(0,a.useMemo)(()=>({textureWidth:256,textureHeight:256,waterNormals:_,sunDirection:new d.Vector3,sunColor:0xffffff,waterColor:7695,distortionScale:3.7,fog:void 0!==N.fog,format:G.outputColorSpace}),[_,G.outputColorSpace,N.fog]),et=(0,a.useMemo)(()=>{if(e)return null;let t=new f(O,ee),a=H.current;return t.material.onBeforeCompile=e=>{e.uniforms.waveAmp=a.waveAmp,e.uniforms.waveTime=a.waveTime,e.vertexShader=e.vertexShader.replace("void main() {",`
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
        `).replace(/vec4\( position, 1.0 \)/g,"vec4( wavePos, 1.0 )")},t},[O,ee,e]);return(0,c.useFrame)((t,a)=>{if(v.current&&(v.current.material.uniforms.time.value+=.5*a),H.current.waveTime.value+=a,Z.current&&Z.current.visible&&(Z.current.rotation.y+=.004*a),$.current&&K.current){let e=$.current.geometry.attributes.position,t=e.array,r=160*a;for(let e=1;e<t.length;e+=3)t[e]-=r,t[e]<0&&(t[e]+=220);e.needsUpdate=!0}if(W.current+=a,W.current<1)return;let r=W.current;W.current=0;let o=A.current,i=o&&"number"==typeof o.latitude?o.latitude:46.15,n=o&&"number"==typeof o.longitude?o.longitude:-1.15,s=(0,k.vesselNow)(),l=T.default.get("debugMode"),u=s;if(l){null===C.current&&(C.current=Date.now());let e=(Date.now()-C.current)/1e3*720%86400,t=Math.floor(e/3600),a=Math.floor(e%3600/60),r=new Date(s.getTime());r.setHours(t,a,0,0),u=r}let{elevation:c,azimuth:f}=(0,D.sunPosition)(i,n,u),g=0;g=c<=-10?1:c>=5?0:(5-c)/15;let x=m||c<=-5,y=x?Math.max(c,20):Math.max(c,5),b=d.MathUtils.degToRad(90-y),j=d.MathUtils.degToRad(f);if(L.setFromSphericalCoords(1,b,j),v.current){let e=h()?.speed??5;I.current+=(e-I.current)*Math.min(.5*r,1);let t=Math.min(Math.max(.5*I.current,0),8),a=v.current.material.uniforms;a.distortionScale.value=t,a.sunDirection.value.copy(L).normalize();let o=T.default.get("aisLengthScalingFactor")||.7,i=Math.min(.21*I.current**2/9.81,6);H.current.waveAmp.value=i/2*o,z.copy(F).lerp(R,g),a.sunColor.value.setHex(x?4491519:0xffffff),a.waterColor.value.copy(z)}e&&(z.copy(V).lerp(R,g),U.color.copy(z));let P=p(),G=Math.min(Math.max(P?.cloudCover??0,0),1),N=Math.max(P?.rain??0,0),B=N>.05;if(Z.current){Z.current.visible=G>.08;let e=(1-.7*g)*(B?.55:1);E.setScalar(e),q.color.copy(E),q.opacity=.15+.55*G}if(K.current=B,$.current&&($.current.visible=B,Q.opacity=Math.min(.3+.15*N,.75)),M.current){let t=M.current.material.uniforms,a=.5+.5*(P?.humidity??.6)+9*G+4*!!B,r={turbidity:e?Math.min(a,2.5):a,rayleigh:1.2*(1-.5*G),mieCoefficient:.005+.02*G,mieDirectionalG:.8},o={turbidity:.05,rayleigh:.1,mieCoefficient:5e-4,mieDirectionalG:.95},i=e=>r[e]+(o[e]-r[e])*g;t.turbidity.value=i("turbidity"),t.rayleigh.value=i("rayleigh"),t.mieCoefficient.value=i("mieCoefficient"),t.mieDirectionalG.value=i("mieDirectionalG"),t.sunPosition.value.copy(L)}S.current&&(S.current.position.copy(L).multiplyScalar(4e3),S.current.visible=!x),w.current&&(w.current.position.copy(L).multiplyScalar(4e3),w.current.visible=x,w.current.lookAt(0,0,0))}),(0,a.useEffect)(()=>()=>{et&&(et.material.uniforms.mirrorSampler?.value?.renderTarget?.dispose(),et.material.dispose())},[et]),(0,a.useEffect)(()=>()=>{O.dispose(),U.dispose(),X.dispose(),q.dispose(),J.dispose(),Q.dispose()},[O,U,X,q,J,Q]),(0,a.useEffect)(()=>{let e=new d.Color(!i&&n?n:m?517:6694);return N.background=e,N.fog=new d.FogExp2(e,r),G.outputColorSpace=d.SRGBColorSpace,()=>{N.background=null,N.fog=null}},[N,m,G,r,i,n]),(0,t.jsxs)(t.Fragment,{children:[i&&m&&(0,t.jsx)(P,{radius:5e3,depth:50,count:1500,factor:4,saturation:0,fade:!0,speed:1}),i&&(0,t.jsx)("sky",{ref:M,scale:45e4}),i&&m&&(0,t.jsxs)("mesh",{ref:w,position:[600,200,-1500],children:[(0,t.jsx)("sphereGeometry",{args:[80,32,32]}),(0,t.jsx)("meshStandardMaterial",{map:B,emissive:0xffffff,emissiveIntensity:.8})]}),i&&(0,t.jsxs)("mesh",{ref:S,children:[(0,t.jsx)("sphereGeometry",{args:[200,32,32]}),(0,t.jsx)("meshBasicMaterial",{color:0xffffff})]}),i&&(0,t.jsx)("group",{ref:Z,visible:!1,children:Y.map((e,a)=>(0,t.jsx)("sprite",{position:e.position,scale:e.scale,material:q},a))}),i&&(0,t.jsx)("points",{ref:$,geometry:J,material:Q,visible:!1}),o?e?(0,t.jsx)("mesh",{geometry:O,material:U,"rotation-x":-Math.PI/2,position:[0,-.3,0],renderOrder:-1}):(0,t.jsx)("primitive",{ref:v,object:et,"rotation-x":-Math.PI/2,position:[0,-.3,0]}):null]})};var I=e.i(66799),W=e.i(78461),G=e.i(3950),N=e.i(83646);let L="https://tile.openstreetmap.org/{z}/{x}/{y}.png",B={day:"brightness(0.72) saturate(1.15) contrast(1.05)",dark:"invert(1) hue-rotate(180deg) brightness(0.82) saturate(0.7) contrast(0.92)",night:"invert(1) brightness(0.55) sepia(1) hue-rotate(-38deg) saturate(2.4) contrast(0.95)"},_={day:"none",dark:"brightness(0.62)",night:"brightness(0.4) sepia(1) hue-rotate(-38deg) saturate(2)"},O={day:"none",dark:"brightness(0.9)",night:"sepia(1) hue-rotate(-38deg) saturate(2.4) brightness(0.7)"};function U(e,t,a,r){return e.replace("{z}",t).replace("{x}",a).replace("{y}",r)}function V(e,t){return 156543.03*Math.cos(e*Math.PI/180)/Math.pow(2,t)}let H=new Map;function Z(e){if(H.has(e))return H.get(e);let t=(0,G.cachedImage)(e).catch(()=>null);return H.set(e,t),t}async function $(e,t,a,r){let o=await Z(U(e,t,a,r));if(o)return{img:o,sx:0,sy:0,sSize:256};for(let i=1;i<=3&&t-i>=1;i++){let n=t-i,s=a>>i,l=r>>i;if(o=await Z(U(e,n,s,l))){let e=256/Math.pow(2,i);return{img:o,sx:(a-(s<<i))*e,sy:(r-(l<<i))*e,sSize:e}}}return null}let K=null;async function X(e,t,a,r,o=1,i="none"){let n,{latitude:s,longitude:l}=t,u=256*o,c=i&&"none"!==i,d=e;c&&(K||((K=document.createElement("canvas")).width=1024,K.height=1024),e=K.getContext("2d"));let m=(l+180)/360*Math.pow(2,a),h=(1-Math.log(Math.tan(n=s*Math.PI/180)+1/Math.cos(n))/Math.PI)/2*Math.pow(2,a),f=m*u-512,p=h*u-512,v=Math.floor(f/u),g=Math.floor(p/u),x=Math.ceil(1024/u)+2,y=Math.pow(2,a),M=[];for(let e=0;e<x;e++)for(let t=0;t<x;t++){let r=v+t,o=g+e;if(o<0||o>=y)continue;let i=(r%y+y)%y,n=Math.round(r*u-f),s=Math.round(o*u-p);M.push({z:a,x:i,y:o,screenLeft:n,screenTop:s})}let b=await Promise.all(M.map(e=>$(r,e.z,e.x,e.y)));c&&e.clearRect(0,0,1024,1024);for(let t=0;t<M.length;t++){let a=b[t];if(!a)continue;let{screenLeft:r,screenTop:o}=M[t];e.drawImage(a.img,a.sx,a.sy,a.sSize,a.sSize,r,o,u,u)}c&&(d.filter=i,d.drawImage(K,0,0),d.filter="none")}async function Y(e,t,a,r){let o=e.getContext("2d");for(let e of(o.clearRect(0,0,1024,1024),r)){if(!e?.template||null!=e.maxBaseZoom&&a>e.maxBaseZoom)continue;let r=Math.min(a,e.maxZoom??a),i=Math.pow(2,a-r);await X(o,t,r,e.template,i,e.filter||"none")}}function q({mode:e="chart",opacity:r=1}){let{heading:o}=(0,W.default)(),i=(0,a.useRef)(),n=(0,a.useRef)(null),s=(0,a.useRef)(null),u=(0,a.useRef)(!1),m=(0,a.useRef)({position:null,zoom:null}),h=(0,a.useRef)(0),{id:f}=(0,N.default)(),p=r<1?"day":f,v=B[p]||B.day,g=(0,a.useRef)([]),{gl:x}=(0,l.useThree)(),M=T.default.get("aisLengthScalingFactor")||.7,[b,w]=(0,a.useState)(16),[S,C]=(0,a.useState)(500),j=(0,y.useSignalKPath)("navigation.position"),P=(0,a.useRef)(null);(0,a.useEffect)(()=>{P.current=j},[j]);let k=j?.latitude!=null&&j?.longitude!=null;(0,c.useFrame)(({camera:t})=>{if(h.current++,h.current%15!=0)return;let a=P.current;if(a?.latitude==null)return;let r=Math.min(Math.max(4*(t.position.length()/M),"meteo"===e?3e3:500),6e4),o=Math.max(3,Math.min("meteo"===e?15:g.current[0]?.template===L?19:18,Math.round(Math.log2(156543.03*Math.cos(a.latitude*Math.PI/180)/(r/1024)))));o!==b&&w(o)});let D=(0,a.useRef)(!1),F=(0,a.useRef)(null),R=(0,a.useCallback)((e=!1)=>{if(u.current){D.current=!0;return}let t=P.current;if(t?.latitude==null||t?.longitude==null)return;let a=m.current;if(!e&&a.position&&a.zoom===b){let e=48*V(t.latitude,b)/111320,r=Math.abs(t.latitude-a.position.latitude),o=Math.abs(t.longitude-a.position.longitude);if(r<e&&o<e)return}let r=n.current,o=s.current;if(!r||!o)return;u.current=!0,m.current={position:t,zoom:b};let i=1024*V(t.latitude,b);Y(r,t,b,g.current).then(()=>{o.needsUpdate=!0,C(i/2*M)}).catch(e=>console.warn("MapPlane3D: tile rendering failed:",e?.message||e)).finally(()=>{u.current=!1,D.current&&(D.current=!1,F.current?.())})},[b,M]);(0,a.useEffect)(()=>{F.current=R},[R]),(0,a.useEffect)(()=>{let e=document.createElement("canvas");e.width=1024,e.height=1024,n.current=e;let t=new d.CanvasTexture(e);return t.minFilter=d.LinearMipmapLinearFilter,t.magFilter=d.LinearFilter,t.anisotropy=x.capabilities.getMaxAnisotropy(),t.generateMipmaps=!0,s.current=t,i.current&&(i.current.material.map=t,i.current.material.needsUpdate=!0),()=>{t.dispose()}},[x]),(0,a.useEffect)(()=>{let t=!1,a=()=>{t||F.current?.(!0)},r=[{template:L,maxZoom:19,filter:v},..."meteo"===e?[]:[{template:"https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",maxZoom:18,filter:O[p]}]];return(g.current=r,"meteo"===e)?(a(),fetch("https://api.rainviewer.com/public/weather-maps.json").then(e=>e.json()).then(e=>{let r=e?.radar?.past,o=r?.[r.length-1]?.path;o&&!t&&(g.current=[...g.current,{template:`https://tilecache.rainviewer.com${o}/256/{z}/{x}/{y}/2/1_1.png`,maxZoom:7,maxBaseZoom:12}],a())}).catch(()=>{}),()=>{t=!0}):(I.default.apiCall("/signalk/v1/api/resources/charts").then(e=>{if(t||!e||"object"!=typeof e)return;let r=Object.values(e),o=r.find(e=>"openstreetmap"!==e.identifier&&e.tilemapUrl)||r.find(e=>e.tilemapUrl);o?.tilemapUrl&&(g.current=[{template:o.tilemapUrl.includes("{z}")?o.tilemapUrl:`${o.tilemapUrl}/{z}/{x}/{y}.png`,maxZoom:18,filter:_[p]}]),a()}).catch(()=>{t||(g.current=r,a())}),()=>{t=!0})},[e,p]),(0,a.useEffect)(()=>{R()},[j,e,b]),(0,a.useEffect)(()=>{i.current&&s.current&&(i.current.material.map=s.current,i.current.material.needsUpdate=!0)});let z=(0,a.useMemo)(()=>new d.PlaneGeometry(1,1),[]),E=(0,a.useMemo)(()=>new d.MeshBasicMaterial({side:d.DoubleSide,transparent:r<1,opacity:r,depthWrite:r>=1,polygonOffset:!0,polygonOffsetFactor:2,polygonOffsetUnits:8}),[r]);return((0,a.useEffect)(()=>()=>{z.dispose(),E.dispose()},[z,E]),k)?(0,t.jsx)("group",{rotation:[0,o,0],children:(0,t.jsx)("mesh",{ref:i,geometry:z,material:E,rotation:[-Math.PI/2,0,0],position:[0,-.1,0],scale:[2*S,2*S,1]})}):null}var J=e.i(43216),Q=e.i(46991),ee=e.i(62588),et=e.i(77291),ea=e.i(34297),er=e.i(8066),eo=e.i(98392);let ei=e=>-5+10*e,en=Array.from({length:49},(e,t)=>{let a=t/48;return a*a*(3-2*a)*.3+.7*a}),es=({beam:e,draft:t,freeboard:a,entry:r=.3,run:o=.15,transom:i=.85,bowRise:n=.25,deadrise:s=.15,bilge:l=.25,flare:u=.15})=>{let c=t=>Math.max(.015,e/2*Math.sin(Math.min(t/r,1)*Math.PI/2)**1.4*(t>1-o?1-(1-i)*((t-(1-o))/o)**1.6:1)),d=e=>a+n*Math.max(0,1-e/.4)**2,m=e=>{let a=c(e),r=t*Math.min(1,.2+e/.1)*(e>.85?1-.3*(e-.85)/.15:1),o=d(e),i=Math.min(l,.8*r,.55*a),n=a-i,m=[[0,-r],[.5*n,-r+r*s*.35],[n,-r+r*s*.6]],h=-r+r*s*.6+i;for(let e of[.25,.5,.75,1]){let t=-Math.PI/2+e*Math.PI/2;m.push([n+i*Math.cos(t),h+i*Math.sin(t)])}let f=u*a*Math.max(0,1-e/.35);return m.push([a+.4*f,(h+o)/2],[a+f,o]),m},h=(0,er.bothSides)((0,er.loft)(en.map(e=>({z:ei(e),pts:m(e)})))),f=(0,er.bothSides)((0,er.loft)(en.map(e=>{let t=m(e)[m(e).length-1][0];return{z:ei(e),pts:[[0,d(e)+.015],[.6*t,d(e)+.01],[t,d(e)]]}}),!0)),p=m(1),v=(0,er.cap)([...p.slice().reverse().map(([e,t])=>[-e,t]),...p.slice(1)],ei(1)),g=(e,t)=>{let a=m(e);for(let e=1;e<a.length;e++)if(t<=a[e][1]){let[r,o]=a[e-1],[i,n]=a[e];return r+(i-r)*(0,er.clamp01)((t-o)/(n-o||1))}return a[a.length-1][0]},x=(0,er.bothSides)((0,er.loft)(en.slice(1).map(e=>({z:ei(e),pts:[[g(e,-.02)+.006,-.02],[g(e,.06)+.006,.06]]}))));return{body:(0,er.merge)([h,f,v]),dark:x,deckAt:d,beamAt:c,sideX:g,flareAt:e=>u*Math.max(0,1-e/.35)}},el=(e,t,a,[r,o,i],n=.06)=>{let s=new ea.RoundedBoxGeometry(e,t,a,2,Math.max(.001,.99*Math.min(n,e/2,t/2,a/2)));return s.translate(r,o+t/2,i),s},eu=(e,t,[a,r,o],i=.12)=>el(e+.02,i,t+.02,[a,r,o],.02),ec=(e,t,a=0)=>{let r=new d.Shape(e.map(([e,t])=>new d.Vector2(-e,t))),o=new d.ExtrudeGeometry(r,{depth:t,bevelEnabled:!0,bevelThickness:.03,bevelSize:.03,bevelSegments:2});return o.rotateY(Math.PI/2),o.translate(a-t/2,0,0),o},ed=(e,t,[a,r,o],i=16,n=e)=>{let s=new d.CylinderGeometry(n,e,t,i);return s.translate(a,r+t/2,o),s},em=([e,t,a],r=.6)=>[ed(.03,r,[e,t,a],8,.022),el(.34,.03,.05,[e,t+.7*r,a],.01),el(.26,.035,.07,[e,t+r+.02,a],.015)],eh=([e,t,a],r=1)=>[ed(.07,.35,[e,t,a],12,.06),el(.14,.1,.16,[e,t+.35,a],.03),(0,er.tube)([e,t+.4,a],[e+.55*r,t+.75,a+.25],.025,.018,8)],ef=([e,t,a],r=.32,o=.07,i=0)=>{let n=new d.CapsuleGeometry(o,r,4,10);return n.rotateX(Math.PI/2+i),n.translate(e,t,a),n},ep=([e,t,a],r,o=.32,i=.07)=>{let n=Math.sign(e)||1;return[ef([e,t,a],o,i),(0,er.tube)([e-n*i*1.2,t-i,a-.35*o],[e+n*i*.4,r,a-.35*o],.012,.012,6),(0,er.tube)([e-n*i*1.2,t-i,a+.35*o],[e+n*i*.4,r,a+.35*o],.012,.012,6)]},ev=(e,t,a,r=.12)=>(0,er.bothSides)((0,er.loft)(Array.from({length:17},(o,i)=>{let n=t+i/16*(a-t),s=e.beamAt(n)*(1+.3*e.flareAt(n)),l=e.deckAt(n);return{z:ei(n),pts:[[s-.035,l],[s-.035,l+r],[s,l+r],[s,l]]}}))),eg=(e,t,a,r,o=.09)=>{let i=[];for(let n=0;n<=16;n++){let s=a+n/16*(r-a);i.push(new d.Vector3(e.sideX(s,t)+.6*o,t,ei(s)))}let n=i.map(e=>new d.Vector3(-e.x,e.y,e.z)),s=0===a?[...n.reverse(),...i.slice(1)]:[...i,...n.reverse().slice(1)];return new d.TubeGeometry(new d.CatmullRomCurve3(s),64,o,8,!1)},ex=(e,t,a,r,o)=>(0,er.bothSides)((0,er.loft)(Array.from({length:13},(i,n)=>{let s=t+n/12*(a-t);return{z:ei(s),pts:[[e.sideX(s,r)+.01,r],[e.sideX(s,o)+.01,o]]}}))),ey=(e,t,a)=>new d.Vector3(e,t,a),eM=(e,t,a,r={})=>{let o=(0,eo.makeSailGeometry)({tack:e,head:t,clew:a,camber:.07,draft:.4,twist:.08,leeward:1,rows:8,cols:6,...r});return o.deleteAttribute("uv"),o},eb=({beam:e,mast:t,mizzen:a=0,roof:r=.35,saloon:o=!1,freeboard:i=.55,overhang:n=0})=>{let s=es({beam:e,draft:.25,freeboard:i,entry:.5,run:.28,transom:.86,bowRise:.1,deadrise:.55,bilge:.25,flare:.1}),l=s.deckAt(.5),u=.62*e,c=[s.body,ec([[-2.3,0],[-1.6,r],[1.2,r],[1.35,0]],u).translate(0,l,0),(0,er.foil)({y:-.15,lead:-.85,chord:.8},{y:-1.55,lead:-.6,chord:.55},.12),el(.26,.24,1.1,[0,-1.8,-.35],.11),(0,er.foil)({y:0,lead:3.85,chord:.4},{y:-1,lead:3.95,chord:.28},.11)],d=[s.dark,ec([[-2.1,.35*r],[-1.68,.82*r],[1,.82*r],[1.05,.35*r]],u+.03).translate(0,l,0),ex(s,.3,.62,.55*i,.72*i),ec([[1.2,0],[1.4,.9*r],[1.9,.95*r],[2,0]],.85*u).translate(0,l,0)];o&&(c.push(ec([[-.9,0],[-.4,.42],[1.1,.42],[1.2,0]],.9*u).translate(0,l+r,0)),d.push(ec([[-.78,.08],[-.45,.34],[1,.34],[1.05,.08]],.9*u+.03).translate(0,l+r,0)));let m=l+t;return c.push(ed(.07,t,[0,l,-.9],10,.045)),c.push((0,er.tube)([0,l+1,-.9],[0,l+1,2.7],.06)),c.push(eM(ey(0,l+1.1,-.9+.08),ey(0,m-.3,-.9+.08),ey(0,l+1.15,2.6),{headWidth:.4})),c.push(eM(ey(0,l+.15,-4.9-n),ey(0,m-.12*t,-.9-.05),ey(0,l+.6,-.9+1.4))),c.push((0,er.tube)([0,l+.1,-4.95-n],[0,m-.12*t,-.9],.012)),c.push((0,er.tube)([0,m,-.9],[0,l+.1,4.9],.012)),a&&(c.push(ed(.055,a,[0,l,3.2],10,.035)),c.push(eM(ey(0,l+.8,3.2+.06),ey(0,l+a-.2,3.2+.06),ey(0,l+.85,4.9)))),{body:c,dark:d}},ew={30:()=>{let e=es({beam:2.8,draft:.6,freeboard:.62,entry:.42,run:.2,transom:.82,bowRise:.5,deadrise:.35,bilge:.35,flare:.25}),t=e.deckAt(.45),a=new d.CylinderGeometry(.32,.32,1.2,18);return a.rotateZ(Math.PI/2),a.translate(0,t+.42,2.3),{body:[e.body,ev(e,.12,1,.16),el(1.8,.45,1.9,[0,t,-1],.06),ec([[-1.85,0],[-1.65,.5],[-.45,.52],[-.4,0]],1.5).translate(0,t+.45,0),...em([.35,t+.97,-1],.35),ed(.05,1.7,[0,t+.97,-.5],10,.035),(0,er.tube)([0,t+1.4,-.5],[0,t+.55,1.5],.03,.025,8),(0,er.tube)([.7,t+.3,-.3],[.45,t+2.3,-.4],.03,.025,8),(0,er.tube)([-.7,t+.3,-.3],[-.45,t+2.3,-.4],.03,.025,8),a,el(.25,.42,.25,[-.75,t,2.3],.04),el(.25,.42,.25,[.75,t,2.3],.04),(0,er.tube)([-1.05,t,4.2],[-.95,t+1.35,4.2],.06),(0,er.tube)([1.05,t,4.2],[.95,t+1.35,4.2],.06),(0,er.tube)([-.95,t+1.35,4.2],[.95,t+1.35,4.2],.06),ed(.12,.22,[-.65,t+.97,-.3],10)],dark:[e.dark,ec([[-1.75,.18],[-1.66,.42],[-.5,.44],[-.47,.18]],1.52).translate(0,t+.45,0),ex(e,.05,.95,e.deckAt(.5)-.12,e.deckAt(.5)-.06)]}},31:()=>{let e=es({beam:3.5,draft:.75,freeboard:.65,entry:.5,run:.25,transom:.78,bowRise:.35,deadrise:.3,bilge:.5,flare:.15}),t=e.deckAt(.45),a=(0,er.merge)([eg(e,e.deckAt(.1)-.15,0,.22,.13),eg(e,t-.12,.88,1,.1)]);return{body:[e.body,el(2.4,.65,3,[0,t,-.3],.1),el(1.9,.8,1.5,[0,t+.65,-.6],.1),ed(.05,1,[0,t+1.45,-.2]),el(.8,.45,.5,[0,t,3.4],.08),ed(.12,.5,[0,t,2.5]),a,...em([0,t+1.45,-.2],.55),...((e,t)=>{let a=[];for(let r=0;r<6;r++){let o=.28+r/5*.57;for(let r of[-1,1]){let i=new d.TorusGeometry(.09,.035,6,12);i.rotateY(Math.PI/2),i.translate(r*(e.sideX(o,t)+.03),t,ei(o)),a.push(i)}}return a})(e,t-.12),ev(e,.18,1,.14)],dark:[e.dark,eu(1.9,1.5,[0,t+1.05,-.6],.35),eu(2.4,3,[0,t+.3,-.3],.08)]}},35:()=>{let e=es({beam:1.3,draft:.35,freeboard:.6,entry:.42,run:.12,transom:.92,bowRise:.22,deadrise:.3,bilge:.15,flare:.3}),t=e.deckAt(.5),a=new d.ConeGeometry(.24,1.4,4);return a.rotateY(Math.PI/4),a.translate(0,t+1.5,.2),{body:[e.body,ec([[-1.7,0],[-1.15,.82],[1.5,.82],[2.6,0]],1.05).translate(0,t,0),a,ed(.24,.2,[0,t,-2.75],12,.18),(0,er.tube)([0,t+.12,-2.75],[0,t+.18,-3.7],.035),el(1,.1,1.3,[0,t,3.7],.04),new d.SphereGeometry(.16,14,10).translate(0,t+2.25,.2),el(.5,.08,.4,[0,t,-2.1],.02),el(.4,.45,.5,[0,t+.82,.9],.04),ed(.12,.2,[.4,t+.82,1.4],10)],dark:[e.dark,ec([[-1.42,.55],[-1.24,.72],[-.3,.72],[-.3,.55]],1.07).translate(0,t,0)]}},37:()=>{let e=es({beam:3.1,draft:.38,freeboard:.85,entry:.45,run:.1,transom:.95,bowRise:.28,deadrise:.8,bilge:.14,flare:.3}),t=e.deckAt(.5);return{body:[e.body,ec([[-1.9,0],[-.5,.72],[2.7,.75],[2.85,0]],2.5).translate(0,t,0),ec([[.1,0],[.45,.32],[2.2,.32],[2.3,0]],2).translate(0,t+.75,0),(0,er.tube)([-.9,t+1.07,1.7],[0,t+1.6,1.8],.05),(0,er.tube)([.9,t+1.07,1.7],[0,t+1.6,1.8],.05),el(2.6,.06,.5,[0,.12,4.85],.02),el(.6,.04,.25,[0,t+1.62,1.8],.02)],dark:[e.dark,ex(e,.3,.62,.42,.55),ec([[.14,.1],[.38,.3],[.7,.3],[.7,.1]],2.03).translate(0,t+.75,0),ec([[-1.55,.2],[-.62,.66],[2.4,.68],[2.5,.2]],2.53).translate(0,t,0)]}},40:()=>{let e=es({beam:.72,draft:.3,freeboard:.75,entry:.55,run:.08,transom:.92,bowRise:.08,deadrise:.6,bilge:.1,flare:.05}),t=e=>(0,er.merge)([e.clone().translate(-1.25,0,0),e.clone().translate(1.25,0,0)]);return{body:[t(e.body),el(3.2,.25,8.4,[0,.55,.5],.08),ec([[-3.6,0],[-2.2,.85],[4.2,.85],[4.45,0]],2.9).translate(0,.8,0),ec([[-1.6,0],[-1.1,.35],[.4,.35],[.5,0]],1.5).translate(0,1.65,0),...em([0,2,-.2],.4)],dark:[t(e.dark),ec([[-3.2,.35],[-2.35,.75],[4,.75],[4,.35]],2.93).translate(0,.8,0),ec([[-1.45,.12],[-1.15,.3],[.3,.3],[.3,.12]],1.53).translate(0,1.65,0)]}},50:()=>{let e=es({beam:3,draft:.45,freeboard:.8,entry:.45,run:.12,transom:.9,bowRise:.32,deadrise:.7,bilge:.18,flare:.3}),t=e.deckAt(.5);return{body:[e.body,ec([[-1.2,0],[-.75,1],[1.65,1],[1.8,0]],2.1).translate(0,t,0),ed(.05,1.1,[0,t+1,.7]),el(1,.1,.14,[0,t+1.9,.7],.03),el(.3,.035,.07,[0,t+1.2,.2],.015)],dark:[e.dark,ex(e,.1,.95,e.deckAt(.5)-.14,e.deckAt(.5)-.02),ec([[-.95,.55],[-.8,.9],[1.55,.92],[1.6,.55]],2.13).translate(0,t,0)]}},60:()=>{let e=es({beam:1.5,draft:.3,freeboard:.7,entry:.3,run:.1,transom:.9,bowRise:.12,deadrise:.05,bilge:.15,flare:.22}),t=e.deckAt(.5),a=[e.body,ev(e,0,.18,.1)],r=[e.dark,ex(e,.12,.92,.38,.43),ex(e,.15,.9,.53,.58)],o=t;[[-3,4.75,1.48,.3,.25],[-2.75,4.45,1.46,.28,.3],[-2.45,3.9,1.44,.28,.32],[-2.15,3.2,1.36,.26,.3],[-1.6,2.4,1.1,.22,.25]].forEach(([e,t,i,n,s],l)=>{if(a.push(ec([[e+s,0],[e+.35*s,.35*n],[e,.75*n],[e+.04,n],[t,n],[t,0]],i).translate(0,o,0)),r.push(ec([[e+.55*s-.01,.25*n],[e-.012,.7*n],[t-.12,.7*n],[t-.12,.25*n]],i+.024).translate(0,o,0)),2===l)for(let e of[-1,1])for(let t=0;t<4;t++)a.push(...ep([e*(i/2+.07),o+.1,-.9+.8*t],o+n+.02,.36,.07));3===l&&(a.push(el(1.6,.06,.32,[0,o+n-.06,e+.25],.02)),r.push(el(1.38,.08,.06,[0,o+.55*n,e-.01],.01))),o+=n});let i=ec([[1.7,0],[1.95,.55],[2.5,.55],[2.4,0]],.42);for(let[n,s,l]of(i.translate(0,o-.22,0),a.push(i),r.push(ec([[1.92,.47],[1.96,.56],[2.51,.56],[2.49,.47]],.44).translate(0,o-.22,0)),a.push(...em([0,o,-1],.45)),a.push(ed(.02,.35,[0,e.deckAt(.02),-4.6],8)),[[4.75,1.48,t+.3],[4.45,1.46,t+.58],[3.9,1.44,t+.86]]))a.push(el(s,.05,.02,[0,l+.05,n-.01],.005));return{body:a,dark:r}},70:()=>{let e=es({beam:1.5,draft:.45,freeboard:.55,entry:.22,run:.14,transom:.82,bowRise:.18,deadrise:0,bilge:.12,flare:.12}),t=e.deckAt(.5),a=[e.body];for(let r=0;r<7;r++){let o=-3.45+.93*r,i=(o+5)/10,n=Math.min(1.36,2*e.beamAt(i)-.12),s=[2,3,4,4,4,4,3][r],l=Math.max(2,Math.round(n/.27));for(let e=0;e<l;e++){let i=s-((e+r)%3==0),u=-n/2+n/l*(e+.5);a.push(el(n/l-.025,.12*i,.84,[u,t,o],.015))}}return a.push(el(1.4,1.05,.62,[0,t,3.55],.06)),a.push(el(1.62,.1,.36,[0,t+1.05,3.4],.03)),a.push(el(.34,.42,.3,[0,t+1,3.72],.08)),a.push(el(1,.16,.55,[0,e.deckAt(.03)-.02,-4.4],.05)),a.push(...em([0,t+1.15,3.4],.45)),a.push(ed(.025,.55,[0,e.deckAt(.03)+.14,-4.3],8)),a.push(...eh([.55,t+.5,-1.2],1),...eh([-.55,t+.5,1.6],-1)),a.push(...ep([.78,t+.5,3.6],t+.66),...ep([-.78,t+.5,3.6],t+.66)),{body:a,dark:[e.dark,ex(e,.05,.95,.42,.47),eu(1.64,.38,[0,t+1.06,3.4],.07),eu(1.4,.62,[0,t+.9,3.55]),eu(1.4,.62,[0,t+.62,3.55],.06),eu(1.4,.62,[0,t+.38,3.55],.06),el(.36,.08,.32,[0,t+1.38,3.72],.04)]}},80:()=>{let e=es({beam:1.7,draft:.5,freeboard:.42,entry:.24,run:.12,transom:.84,bowRise:.14,deadrise:0,bilge:.12,flare:.1}),t=e.deckAt(.5),a=[e.body,el(.9,.12,6.4,[0,t,-.7],.04),el(1.5,1,.85,[0,t,3.65],.08),el(1.72,.08,.35,[0,t+1,3.5],.03),el(.4,.42,.32,[0,t+.95,3.85],.08),el(.9,.14,.6,[0,e.deckAt(.03)-.02,-4.35],.05),ed(.035,.7,[0,t+.12,-.6]),(0,er.tube)([0,t+.8,-.6],[.6,t+.55,-.2],.025)];for(let e of[-.25,0,.25])a.push((0,er.tube)([e,t+.17,-3.8],[e,t+.17,2.9],.03,.03,8));for(let e=0;e<6;e++)a.push(el(.06,.06,.06,[.42,t+.12,-3.5+1.2*e],.02));a.push(el(.12,.05,6.6,[-.45,t+.3,-.6],.02));for(let e=0;e<7;e++)a.push(ed(.012,.18,[-.45,t+.12,-3.6+1.1*e],6));for(let r of(a.push(...em([0,t+1.08,3.6],.5)),a.push(...eh([.6,t+.12,-.2],1)),a.push(el(.24,.05,.42,[0,t+.18,4.35],.02)),a.push(ef([0,t+.32,4.36],.28,.075,-.3)),[-4,4.2]))for(let t of[-1,1])a.push(ed(.05,.08,[.45*t,e.deckAt((r+5)/10),r],10));return{body:a,dark:[e.dark,ex(e,.05,.95,.32,.37),eu(1.74,.37,[0,t+1,3.5],.06),eu(1.5,.85,[0,t+.85,3.65]),eu(1.5,.85,[0,t+.58,3.65],.06),eu(1.5,.85,[0,t+.34,3.65],.06),el(.42,.08,.34,[0,t+1.33,3.85],.04)]}},"36s":()=>eb({beam:3,mast:12.5,roof:.3}),"36m":()=>eb({beam:3.3,mast:13.8,roof:.36}),"36k":()=>eb({beam:2.9,mast:12,mizzen:8,roof:.3,saloon:!0,freeboard:.5,overhang:.4}),"36y":()=>eb({beam:2.4,mast:14.5,roof:.28,saloon:!0,freeboard:.5}),"36c":()=>{let e=es({beam:1.25,draft:.2,freeboard:.72,entry:.5,run:.1,transom:.92,bowRise:.08,deadrise:.6,bilge:.25,flare:.05}),t=e=>(0,er.merge)([e.clone().translate(-2,0,0),e.clone().translate(2,0,0)]),a=[t(e.body),el(3.6,.3,6.5,[0,.47,1.4],.1),ec([[-1.8,0],[-1,.65],[2.4,.68],[2.4,0]],3.4).translate(0,.77,0),el(3.4,.06,1.6,[0,1.45,3.2],.03),...[-1,1].flatMap(e=>[4,2.5].map(t=>ed(.035,.68,[1.6*e,.77,t],8))),(0,er.tube)([-2,.72,-3.6],[2,.72,-3.6],.07),ed(.08,15,[0,.77,-1.7],10,.05),(0,er.tube)([0,1.72,-1.7],[0,1.72,2.6],.06),eM(ey(0,1.82,-1.62),ey(0,15.42,-1.62),ey(0,.72+1.15,2.5),{headWidth:.6}),eM(ey(0,.82,-3.6),ey(0,13.72,-1.75),ey(0,1.42,-.6))],r=[t(e.dark),ec([[-1.6,.18],[-1.05,.58],[2.2,.6],[2.25,.18]],3.43).translate(0,.77,0)];for(let t of[-1,1])r.push(ex(e,.3,.7,.42,.55).translate(2*t,0,0));return{body:a,dark:r}}},eS=new Map;Object.keys(ew);let eC={normal:new d.MeshStandardMaterial({color:9080983,roughness:.5,metalness:.05,side:d.DoubleSide}),alert:new d.MeshStandardMaterial({color:0xd2504f,roughness:.6,metalness:0,side:d.DoubleSide,transparent:!0,opacity:.88}),selected:new d.MeshStandardMaterial({color:638975,roughness:.5,metalness:.05,side:d.DoubleSide}),yields:new d.MeshStandardMaterial({color:9406153,roughness:.6,metalness:0,side:d.DoubleSide,transparent:!0,opacity:.88}),close:new d.MeshStandardMaterial({color:0xd9a066,roughness:.6,metalness:0,side:d.DoubleSide,transparent:!0,opacity:.88})},ej=new d.MeshStandardMaterial({color:2501683,roughness:.6,metalness:0});function eP({code:e,scaleFactor:a,beamRatio:r}){let o=(e=>{if(!eS.has(e)){let t=(ew[e]||ew[70])(),a=(0,er.merge)(t.body),r=(0,er.merge)(t.dark);t.body[0].computeBoundingBox();let o=t.body[0].boundingBox;eS.set(e,{body:a,dark:r,beamRatio:(0,er.clamp01)((o.max.x-o.min.x)/10)||.25})}return eS.get(e)})(e),i=r?r/o.beamRatio:1;return(0,t.jsxs)("group",{scale:[a*i,a,a],children:[(0,t.jsx)("mesh",{geometry:o.body,material:eC.normal}),(0,t.jsx)("mesh",{geometry:o.dark,material:ej,userData:{fixed:!0}})]})}let eT=({boatData:e,onClick:a,ref:r})=>{let{length:o,beam:i}=e,n=((e,t,a)=>{let r=Number(e);if(30===r)return 30;if(r>=31&&r<=32)return 31;if(r>=33&&r<=35)return 35;if(36===r)return t>0&&a>0&&a/t>.38?"36c":!(t>0)||t<9?"36s":t<15?"36m":t<24?"36k":"36y";if(37===r)return 37;if(r>=40&&r<=49)return 40;if(r>=50&&r<=59)return 50;if(r>=60&&r<=69)return 60;if(r>=70&&r<=79)return 70;if(r>=80&&r<=89)return 80;if(Number.isFinite(t)&&t>0){if(t<20)return 37;if(t<60)return 50}return 70})(e.shipType,o,i),s=.7*Math.max(o||10,4)/10,l=o>0&&i>0?i/o:null;return(0,t.jsx)("group",{ref:r,onClick:t=>{t.stopPropagation(),a&&a(e.mmsi)},children:(0,t.jsx)(eP,{code:n,scaleFactor:s,beamRatio:l>=.08&&l<=.6?l:null})})};e.i(85269);var ek=e.i(22831);let eD=40*Math.PI/180,eF=({x:e,z:a,course:r,turn:o,color:i})=>{let n,s=[],l=r,u=e+6*Math.sin(r),c=a-6*Math.cos(r);for(let e=0;e<=16;e++)s.push([u,.4,c]),u+=30*Math.sin(l=r+o*eD*((e+1)/16))/16,c-=30*Math.cos(l)/16;let[m,,h]=s[s.length-1];return(0,t.jsxs)("group",{children:[(0,t.jsx)(J.Line,{points:s,color:i,lineWidth:5,transparent:!0,opacity:.7}),(0,t.jsx)("group",{position:[m,.4,h],rotation:[0,-l,0],children:(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("shapeGeometry",{args:[((n=new d.Shape).moveTo(0,3.2),n.lineTo(-2,-.6),n.lineTo(2,-.6),n.closePath(),n)]}),(0,t.jsx)("meshBasicMaterial",{color:i,transparent:!0,opacity:.75,depthWrite:!1,side:d.DoubleSide})]})})]})},eR=()=>{let{t:e}=(0,ek.useTranslation)(),{scene:a}=(0,N.default)(),{encounters:r}=(0,et.default)();return r.slice(0,5).map(({target:r,role:o})=>{let n="stand-on"===o.ownRole||"both"===o.ownRole,s=r.cog??r.cogMagnetic??r.heading??0,l="both"===o.ownRole?e("colregs.labelBoth"):n?e("colregs.labelGiveWay"):e("colregs.labelStandOn"),u=n?a.vesselYields:a.vesselDanger,c=o.targetTurn||1;return(0,t.jsxs)("group",{children:[(0,t.jsx)(i.Html,{position:[r.sceneX,12,r.sceneZ],center:!0,zIndexRange:[15,10],style:{pointerEvents:"none"},children:(0,t.jsxs)("div",{className:"whitespace-nowrap px-2 py-0.5 rounded-full text-caption font-semibold text-white backdrop-blur-sm",style:{background:`color-mix(in srgb, ${u} 72%, transparent)`},children:[r.name," · ",l," · ",e("colregs.rule",{rule:o.rule})]})}),n&&(0,t.jsx)(eF,{x:r.sceneX,z:r.sceneZ,course:s,turn:c,color:u})]},r.mmsi)})},ez=new d.Vector3,eE=new d.Quaternion,eA=new d.Euler,eI={chart:-.1,meteo:-.1},eW=e=>{let t=[];return e.traverse(e=>{e.isMesh&&!e.userData.fixed&&t.push(e)}),t},eG=(e,t,a,r,o)=>{let{x:i,z:n}=(0,ee.predictScenePosition)(t,r,o);ez.set(i,0,n),e.position.lerp(ez,a),eA.set(0,-t.rotationAngleY,0),eE.setFromEuler(eA),e.quaternion.slerp(eE,a)},eN=({targets:e,statuses:r,colors:o})=>(0,a.useMemo)(()=>e.filter(e=>"danger"===e.risk&&e.cpaScene&&e.visible).slice(0,5).map(e=>({mmsi:e.mmsi,sceneX:e.sceneX,sceneZ:e.sceneZ,cpaScene:{...e.cpaScene}})),[e]).map(e=>{let a=e.cpaScene,i="yields"===r[e.mmsi]?o.yields:o.giveWay;return(0,t.jsxs)("group",{children:[(0,t.jsx)(J.Line,{points:[[e.sceneX,.3,e.sceneZ],[a.targetX,.3,a.targetZ]],color:i,lineWidth:2,dashed:!0,dashSize:3,gapSize:2.5,transparent:!0,opacity:.9}),(0,t.jsx)(J.Line,{points:[[0,.3,0],[a.ownX,.3,a.ownZ]],color:i,lineWidth:1.5,dashed:!0,dashSize:2,gapSize:3,transparent:!0,opacity:.6}),(0,t.jsxs)("mesh",{position:[a.targetX,.25,a.targetZ],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[2.2,3,32]}),(0,t.jsx)("meshBasicMaterial",{color:i,transparent:!0,opacity:.8,depthWrite:!1})]})]},e.mmsi)}),eL=({onUpdateInfoPanel:e})=>{let{aisData:r,vesselIds:o,targets:i,targetsRef:n,motionRef:s}=(0,ee.useAIS)(),{states:l}=(0,g.useOcearoContext)(),u=eI[l.oceanMode]??-.3,d=(0,a.useRef)({}),m=(0,a.useRef)({}),[h,f]=(0,a.useState)(null),{scene:p}=(0,N.default)();(0,a.useEffect)(()=>{eC.normal.color.set(p.vessel),eC.alert.color.set(p.vesselDanger),eC.yields.color.set(p.vesselYields),eC.close.color.set(p.vesselClose),eC.selected.color.set(p.route)},[p]);let v=(0,a.useRef)(null),{statuses:x}=(0,et.default)(),M=(0,a.useRef)({});(0,a.useEffect)(()=>{M.current=x},[x]),(0,a.useEffect)(()=>{v.current=h},[h]);let b=(0,a.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),w=(0,y.useSignalKPaths)(b),S=(0,a.useMemo)(()=>{let e=w["navigation.headingTrue"]??w["navigation.headingMagnetic"],t=w["navigation.courseOverGroundTrue"]??w["navigation.courseOverGroundMagnetic"];return e??t??0},[w]);(0,c.useFrame)((e,t)=>{let a=1-Math.exp(-4*Math.min(t,.5)),r=n.current,o=s.current,i=Date.now();for(let e in d.current){let t=d.current[e],n=r[e];if(!t)continue;if(!n||!n.visible){t.visible=!1;continue}t.visible=!0,eG(t,n,a,o,i);let s=M.current[e],l="giveWay"===s?"alert":"yields"===s?"yields":v.current===e?"selected":"close"===s?"close":"normal",u=m.current[e];if(!u||0===u.length){if(0===(u=eW(t)).length)continue;m.current[e]=u,t.userData.look=void 0}if(l!==t.userData.look){let e=eC[l];for(let t of u)t.material=e;t.userData.look=l}}});let C=(0,a.useCallback)(e=>{f(t=>t===e?null:e)},[]),j=(0,a.useRef)({}),P=(0,a.useCallback)(e=>(j.current[e]||(j.current[e]=t=>{if(t){let a=n.current[e];t.userData.mmsi=e,t.position.set(a?.sceneX??0,0,a?.sceneZ??0),t.rotation.set(0,-(a?.rotationAngleY??0),0),d.current[e]=t}else delete d.current[e],delete m.current[e],delete j.current[e]}),j.current[e]),[n]),T=(0,a.useMemo)(()=>o.slice(0,50).map(e=>(0,t.jsx)(eT,{ref:P(e.mmsi),boatData:e,onClick:C},e.mmsi)),[o,C,P]);(0,a.useEffect)(()=>{m.current={}},[o]);let k=h?r[h]:null,D=(e,t,a="",r=!1,o=!1)=>null==t||""===t||"string"==typeof t&&0===t.trim().length?null:(r&&null!==t&&(t=(0,Q.toDegrees)(t)),o&&null!==t&&(t=(0,Q.toKnots)(t)),`${e}: ${t}${a}`),F=k?[D("Vessel",k.name),D("MMSI",(e=>{if(!e)return null;let t=String(e);for(let e of["urn:mrn:imo:mmsi:","urn:mrn:signalk:uuid:"])if(t.startsWith(e)){t=t.substring(e.length);break}return t})(k.mmsi)),D("RNG",k.distanceMeters?k.distanceMeters.toFixed(0):0," m"),D("CPA",null!=k.cpaMeters?(k.cpaMeters/1852).toFixed(2):null," NM"),D("TCPA",null!=k.tcpaSeconds&&k.tcpaSeconds>0?Math.round(k.tcpaSeconds/60):null," min"),D("LOA",k.length," m"),D("Type",k.shipType),D("SOG",k.sog," kn",!1,!0),D("COG",k.cog,"°",!0),D("HDG",k.heading,"°",!0),D("Beam",k.beam," m"),D("Draft",k.draft," m"),D("Call",k.callsign),D("Dest",k.destination)].filter(e=>null!==e).join("\n"):"";return(0,a.useEffect)(()=>{e&&e(F)},[F,e]),(0,t.jsx)(t.Fragment,{children:(0,t.jsxs)("group",{rotation:[0,S,0],position:[0,u,0],children:[T,(0,t.jsx)(eN,{targets:i,statuses:x,colors:{giveWay:p.vesselDanger,yields:p.vesselYields}}),(0,t.jsx)(eR,{})]})})};var eB=e.i(31067);function e_(e,t){let r=e+"Geometry";return a.forwardRef(({args:e,children:o,...i},n)=>{let s=a.useRef(null);return a.useImperativeHandle(n,()=>s.current),a.useLayoutEffect(()=>void(null==t||t(s.current))),a.createElement("mesh",(0,eB.default)({ref:s},i),a.createElement(r,{attach:"geometry",args:e}),o)})}let eO=e_("sphere"),eU=e_("ring");var eV=e.i(16196);let eH=a.default.memo(({radius:e,isOuter:r,markerColorPrimary:o,markerColorGreen:i,markerColorRed:n})=>{let s=(0,a.useMemo)(()=>{let a=[];for(let s=0;s<360;s+=10){let l=d.MathUtils.degToRad(s-90),u=s%30==0,c=r?u?.35:.15:u?.25:.1,m=(e+.5*c+.2)*Math.cos(l),h=(e+.5*c+.2)*Math.sin(l),f=r&&s>0&&s<61,p=r&&s>=300&&s<360,v=f?i:p?n:o;if(!r&&u){let e;e=0===s?"N":90===s?"E":180===s?"S":270===s?"W":s.toString(),a.push((0,t.jsx)(eV.Text,{characters:"NESW0123456789",position:[m,.02,h],color:o,fontSize:.6,rotation:[-Math.PI/2,0,Math.PI/2-l],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e},`text-${s}`))}else a.push((0,t.jsx)(eO,{args:[c/2,16,16],position:[m,0,h],children:(0,t.jsx)("meshBasicMaterial",{color:v,transparent:!0,opacity:u?.8:.4})},`marker-${r?"outer":"inner"}-${s}`))}return a},[e,r,o,i,n]);return(0,t.jsx)(t.Fragment,{children:s})});eH.displayName="StaticMarkers";let eZ=a.default.memo(({innerRadius:e,outerRadius:a,dialColor:r,opacity:o=1,transparent:i=!1})=>(0,t.jsx)(eU,{args:[e,a,64],rotation:[Math.PI/2,0,0],children:(0,t.jsx)("meshBasicMaterial",{color:r,side:d.DoubleSide,transparent:i,opacity:o,depthWrite:!1})}));eZ.displayName="StaticRing";let e$=({outerRadius:e,innerRadius:r})=>{let{scene:o}=(0,N.default)(),i=o.compass,n=o.laylineStarboard,s=o.laylinePort,l=(0,a.useMemo)(()=>["navigation.headingTrue","navigation.headingMagnetic","navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic"],[]),u=(0,y.useSignalKPaths)(l),c=(0,a.useMemo)(()=>{let e=T.default.get("preferredHeadingPath")||"courseOverGroundTrue",t=u[`navigation.${e}`];if(null!=t)return t;let a=u["navigation.headingTrue"]||u["navigation.headingMagnetic"];return u["navigation.courseOverGroundTrue"]||u["navigation.courseOverGroundMagnetic"]||a||0},[u]),d=o.compassFace,m=T.default.get("compassNorthUp"),h=(0,a.useMemo)(()=>({innerRadius:r,outerRadius:e,dialColor:d,markerColorPrimary:i,markerColorGreen:n,markerColorRed:s}),[r,e,d,i,n,s]);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)("group",{rotation:[0,c+(m?0:Math.PI),0],children:[(0,t.jsx)(eZ,{innerRadius:h.innerRadius,outerRadius:h.outerRadius,dialColor:h.dialColor,transparent:!0,opacity:.1}),(0,t.jsx)(eH,{radius:h.innerRadius,isOuter:!1,markerColorPrimary:h.markerColorPrimary,markerColorGreen:h.markerColorGreen,markerColorRed:h.markerColorRed})]}),(0,t.jsxs)("group",{children:[(0,t.jsx)(eZ,{innerRadius:h.innerRadius+.8,outerRadius:h.outerRadius+.8,dialColor:h.dialColor,transparent:!0,opacity:.15}),(0,t.jsx)(eH,{radius:h.innerRadius+.8,isOuter:!0,markerColorPrimary:h.markerColorPrimary,markerColorGreen:h.markerColorGreen,markerColorRed:h.markerColorRed})]})]})};e$.displayName="CompassDial";var eK=e.i(84226);let eX=({visible:e=!0,position:a,scale:r})=>!e||T.default.get("hide3DCompass")?null:(0,t.jsxs)("group",{position:a,scale:r,children:[(0,t.jsx)(e$,{outerRadius:5.6,innerRadius:5}),(0,t.jsx)(eK.default,{outerRadius:5.6+1.1})]});var eY=e.i(20840),eq=e.i(61969),eJ=e.i(539);let eQ=["navigation.courseGreatCircle.nextPoint.bearingTrue","navigation.courseGreatCircle.nextPoint.distance","navigation.speedOverGround"],e0=e=>({x:Math.sin(e),y:Math.cos(e)}),e1=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,e2=`
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uFadeFrom;
    uniform float uFadeTo;
    varying vec2 vUv;
    void main() {
        float across = abs(vUv.x - 0.5) * 2.0;
        float body = 1.0 - smoothstep(0.7, 1.0, across);
        float rim = smoothstep(0.82, 0.92, across) * (1.0 - smoothstep(0.92, 1.0, across));
        float fade = mix(1.0, smoothstep(0.0, 0.35, vUv.y), uFadeFrom)
                   * mix(1.0, 1.0 - smoothstep(0.6, 1.0, vUv.y), uFadeTo);
        gl_FragColor = vec4(uColor, (body * uOpacity + rim * uOpacity * 1.4) * fade);
        #include <colorspace_fragment>
    }
`,e5=({from:e,to:r,width:o=2.4,color:i,opacity:n=.22,fadeFrom:s=!1,fadeTo:l=!1,y:u=0})=>{let c=r[0]-e[0],m=r[1]-e[1],h=Math.hypot(c,m),f=(0,a.useMemo)(()=>new d.ShaderMaterial({uniforms:{uColor:{value:new d.Color},uOpacity:{value:n},uFadeFrom:{value:0},uFadeTo:{value:0}},vertexShader:e1,fragmentShader:e2,transparent:!0,depthWrite:!1,side:d.DoubleSide}),[]);if((0,a.useEffect)(()=>{f.uniforms.uColor.value.set(i),f.uniforms.uOpacity.value=n,f.uniforms.uFadeFrom.value=+!!s,f.uniforms.uFadeTo.value=+!!l},[f,i,n,s,l]),(0,a.useEffect)(()=>()=>f.dispose(),[f]),h<.01)return null;let p=Math.atan2(c,-m);return(0,t.jsx)("group",{position:[(e[0]+r[0])/2,u,(e[1]+r[1])/2],rotation:[0,-p,0],children:(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],material:f,renderOrder:1,children:(0,t.jsx)("planeGeometry",{args:[o,h]})})})},e3=(e,t)=>[e.x*t,-e.y*t],e4=e=>{if(!Number.isFinite(e))return null;let t=Math.round(e/60);return t>=60?`${Math.floor(t/60)}h${String(t%60).padStart(2,"0")}`:`${t} min`},e6=()=>{let e,r,{t:o}=(0,ek.useTranslation)(),{scene:i}=(0,N.default)(),{heading:n}=(0,W.default)(),s=(e=(0,y.useSignalKPaths)(eQ),r=(0,eq.default)(),(0,a.useMemo)(()=>{let t=e["navigation.courseGreatCircle.nextPoint.bearingTrue"],a=e["navigation.courseGreatCircle.nextPoint.distance"],{twd:o,tws:i,twa:n,heading:s}=r;if(![t,a,o,i].every(Number.isFinite)||i<=0)return null;let l={x:a*Math.sin(t),y:a*Math.cos(t)},u=Math.abs((0,eJ.wrapPi)(o-t))<Math.PI/2,c=(u?(0,eJ.optimalUpwind)(1.943844*i):(0,eJ.optimalDownwind)(1.943844*i)).twa*Math.PI/180,d={heading:(0,eJ.wrapPi)(o-c)},m={heading:(0,eJ.wrapPi)(o+c)},h=null;if(Number.isFinite(s)&&Number.isFinite(n)){let t=n>=0?"starboard":"port",a=e0(s),r=e0(("starboard"===t?m:d).heading),o=-(a.x*r.y)- -(a.y*r.x);if(Math.abs(o)>1e-6){let i=(-(l.x*r.y)- -(l.y*r.x))/o,n=(a.x*l.y-a.y*l.x)/o;if(i>0&&n<0){let r=e["navigation.speedOverGround"];h={point:{x:a.x*i,y:a.y*i},distance:i,time:Number.isFinite(r)&&r>.2?i/r:null,onTack:t}}}}return{waypoint:l,upwind:u,port:m,starboard:d,tack:h}},[e,r])),l=T.default.get("aisLengthScalingFactor")||.7;if(!s)return null;let{waypoint:u,port:c,starboard:d,tack:m,upwind:h}=s,f=e3(u,l),p=Math.min(1.3*Math.hypot(f[0],f[1])+200,1500),v=e=>[f[0]-Math.sin(e)*p,f[1]+Math.cos(e)*p],g=m?e3(m.point,l):null,x=Math.min(25,Math.max(3,.015*Math.hypot(f[0],f[1]))),M=e=>[160*Math.sin(e),-(160*Math.cos(e))],b=m?`${o(h?"laylines.tack":"laylines.gybe")} ${(0,Q.convertDistanceUnit)(m.distance)} ${(0,Q.getDistanceUnitLabel)()}${e4(m.time)?` \xb7 ${e4(m.time)}`:""}`:null;return(0,t.jsxs)("group",{rotation:[0,n,0],children:[(0,t.jsx)(e5,{from:v(c.heading),to:f,color:i.laylinePort,y:-.15,width:x,opacity:.3,fadeFrom:!0}),(0,t.jsx)(e5,{from:v(d.heading),to:f,color:i.laylineStarboard,y:-.15,width:x,opacity:.3,fadeFrom:!0}),(0,t.jsx)(e5,{from:[0,0],to:M(c.heading),color:i.laylinePort,y:-.15,width:2.2,opacity:.35,fadeTo:!0}),(0,t.jsx)(e5,{from:[0,0],to:M(d.heading),color:i.laylineStarboard,y:-.15,width:2.2,opacity:.35,fadeTo:!0}),g&&(0,t.jsxs)("group",{children:[(0,t.jsx)(J.Line,{points:[[0,-.15+.05,0],[g[0],-.15+.05,g[1]]],color:i.target,lineWidth:2,dashed:!0,dashSize:2.5,gapSize:2}),(0,t.jsxs)("mesh",{position:[g[0],-.09,g[1]],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1.8,2.6,32]}),(0,t.jsx)("meshBasicMaterial",{color:i.target,transparent:!0,opacity:.9,depthWrite:!1})]}),(0,t.jsx)(eY.Billboard,{position:[g[0],5,g[1]],children:(0,t.jsx)(eV.Text,{fontSize:1.6,color:i.target,anchorX:"center",anchorY:"bottom",font:"fonts/Roboto-Bold.ttf",outlineWidth:.04,outlineColor:i.background,children:b})})]})]})},e8=Math.PI/180,e7=2*e8,e9=[5,10,15],te=["environment.wind.speedTrue","environment.wind.angleTrueWater","environment.current","navigation.headingTrue"],tt=(e,t,a)=>{let r=Math.max(0,Math.min(1,(a-e)/(t-e)));return r*r*(3-2*r)},ta=({unitArc:e,outerSeconds:r,color:o})=>{let i=(0,a.useRef)([]),n=(0,a.useRef)([]);return(0,c.useFrame)(({clock:e})=>{let t=e.elapsedTime/3%1;for(let e=0;e<6;e++){let a=(e+1-t)/6,o=i.current[e],s=n.current[e];if(!o||!s)continue;let l=Math.max(1,a*r);o.scale.set(l,1,l),s.material.opacity=.35*tt(.05,.25,a)*(1-tt(.85,1,a))}}),Array.from({length:6},(a,r)=>(0,t.jsx)("group",{ref:e=>{i.current[r]=e},position:[0,.04,0],children:(0,t.jsx)(J.Line,{ref:e=>{n.current[r]=e},points:e,color:o,lineWidth:1,transparent:!0,opacity:0})},r))};function tr({rings:e}){let r=(0,a.useRef)([]),o=(0,a.useRef)(0);return(0,c.useFrame)(()=>{if(o.current++%6)return;let e=[];r.current.forEach(t=>{if(!t)return;t.style.visibility="visible";let a=t.getBoundingClientRect();e.some(e=>a.left<e.right+4&&a.right>e.left-4&&a.top<e.bottom+2&&a.bottom>e.top-2)?t.style.visibility="hidden":e.push(a)})}),e.map((e,a)=>(0,t.jsx)(i.Html,{position:e.label,zIndexRange:[5,0],style:{pointerEvents:"none"},children:(0,t.jsxs)("div",{ref:e=>{r.current[a]=e},className:"ml-2 -translate-y-1/2 whitespace-nowrap px-1.5 py-px rounded-md text-caption font-semibold tabular-nums text-hud-main bg-hud-bg/70 backdrop-blur-sm",children:[e.min," min",null!=e.nm&&(0,t.jsxs)("span",{className:"text-hud-secondary",children:[" · ",e.nm.toFixed(2)," NM"]})]})},e.min))}let to=function(){let{scene:e,accent:r}=(0,N.default)(),o=(0,y.useSignalKPaths)(te),i=(o["environment.wind.speedTrue"]??0)*1.943844,n=o["environment.wind.angleTrueWater"],s=o["environment.current"],l=o["navigation.headingTrue"],u=(0,a.useMemo)(()=>{if(!(i>.5)||!Number.isFinite(n))return null;let e=((0,eJ.optimalUpwind)(i)?.twa??42)*e8,t=0;for(let e=40;e<=180;e+=10)t=Math.max(t,(0,eJ.polarSpeed)(i,e)??0);let a=60*e9[e9.length-1],r=45/Math.max(1,t/1.943844*a),o=0,u=0;if(s&&Number.isFinite(s.drift)&&Number.isFinite(s.setTrue)&&Number.isFinite(l)){let e=(0,eJ.wrapPi)(s.setTrue-l);o=s.drift*Math.sin(e),u=-s.drift*Math.cos(e)}let c=(e,t)=>{let a=((0,eJ.polarSpeed)(i,(0,eJ.wrapPi)(n-e)/e8)??0)/1.943844*t;return[(Math.sin(e)*a+o*t)*r,.08,(-Math.cos(e)*a+u*t)*r]},d=[];for(let t=n+e;t<=n+2*Math.PI-e+1e-6;t+=e7)d.push(c(t,1).map((e,t)=>1===t?0:e));return d.push(c(n+2*Math.PI-e,1).map((e,t)=>1===t?0:e)),{fixed:e9.map((t,a)=>{let r=60*t,o=[];for(let t=n+e;t<=n+2*Math.PI-e+1e-6;t+=e7)o.push(c(t,r));o.push(c(n+2*Math.PI-e,r));let s=Math.abs((0,eJ.wrapPi)(n))<e,l=s?null:c(0,r),u=s?null:((0,eJ.polarSpeed)(i,(0,eJ.wrapPi)(n)/e8)??0)/1.943844*r/1852,d=l??o[0];return{min:t,nm:u,arc:o,chord:[o[0],o[o.length-1]],here:l,label:[d[0],.6,d[2]],opacity:.8-.15*a}}),unitArc:d,outerSeconds:a}},[i,n,s,l]);return u?(0,t.jsxs)("group",{children:[(0,t.jsx)(ta,{unitArc:u.unitArc,outerSeconds:u.outerSeconds,color:e.compass}),u.fixed.map(a=>(0,t.jsxs)("group",{children:[(0,t.jsx)(J.Line,{points:a.arc,color:e.compass,lineWidth:2,transparent:!0,opacity:a.opacity}),(0,t.jsx)(J.Line,{points:a.chord,color:e.compassDim,lineWidth:1.5,dashed:!0,dashSize:1,gapSize:1,transparent:!0,opacity:.8*a.opacity}),a.here&&(0,t.jsxs)("mesh",{position:a.here,children:[(0,t.jsx)("sphereGeometry",{args:[.5,16,12]}),(0,t.jsx)("meshBasicMaterial",{color:r})]})]},a.min)),(0,t.jsx)(tr,{rings:u.fixed})]}):null};var ti=e.i(58567);let tn=[4,1.35],ts=["environment.wind.speedTrue","environment.wind.directionTrue","navigation.speedThroughWater","navigation.speedOverGround"],tl=`
    uniform float uTime;
    uniform float uAmp;
    uniform float uDir;
    uniform float uWaveLength;
    uniform float uChop;
    uniform vec2 uOffset;
`,tu=`
    ${tl}
    varying vec3 vPos;
    varying vec3 vNormalW;
    varying vec2 vSea;
    varying float vHeight;
    varying float vJacobian;
    varying float vDist;

    #define NW 6
    const float WL[NW] = float[NW](1.0, 0.74, 0.58, 0.45, 0.36, 0.29);
    const float WA[NW] = float[NW](0.46, 0.30, 0.22, 0.15, 0.11, 0.08);
    const float WD[NW] = float[NW](0.0, 0.43, -0.37, 0.86, -0.74, 0.18);
    const float WP[NW] = float[NW](0.0, 1.7, 4.1, 2.3, 5.2, 0.9);

    // Grid spacing around this vertex (the grid is warped x' = R\xb7(0.05\xb7u + 0.95\xb7u\xb3)):
    // a wave shorter than ~4 vertices cannot be drawn, it only shimmers
    float gSpacing;

    void wave(vec2 p, float angle, float L, float a, float steep, float phase,
              inout vec3 disp, inout vec3 dDx, inout vec3 dDy) {
        a *= 1.0 - smoothstep(0.3, 0.6, gSpacing / L);
        vec2 d = vec2(sin(angle), cos(angle));
        float k = 6.2831853 / L;
        float c = sqrt(9.81 * 0.70 / k);
        float f = k * (dot(d, p) - c * uTime) + phase;
        float q = clamp(steep / (k * a * float(NW) + 1e-4), 0.0, 1.0);
        float s = sin(f);
        float co = cos(f);
        disp += vec3(d.x * q * a * co, d.y * q * a * co, a * s);
        // Partial derivatives of the displaced surface (x, y, z) along x and y
        dDx += vec3(-q * d.x * d.x * k * a * s, -q * d.x * d.y * k * a * s, d.x * k * a * co);
        dDy += vec3(-q * d.x * d.y * k * a * s, -q * d.y * d.y * k * a * s, d.y * k * a * co);
    }

    void main() {
        vec2 local = position.xy;
        vec2 sea = local + uOffset;
        float dist = length(local);
        // Calmer far away (clean horizon) and under the hull, which does not heave
        float fade = (1.0 - smoothstep(900.0, 2200.0, dist)) * mix(0.4, 1.0, smoothstep(3.0, 16.0, dist));
        vec2 gu = pow(abs(local) / 2280.0, vec2(1.0 / 3.0));
        float gmax = max(gu.x, gu.y);
        gSpacing = 15.0000 * (0.05 + 2.85 * gmax * gmax);
        vec3 disp = vec3(0.0);
        vec3 dDx = vec3(0.0);
        vec3 dDy = vec3(0.0);
        for (int i = 0; i < NW; i++) {
            wave(sea, uDir + WD[i], uWaveLength * WL[i], uAmp * WA[i], uChop, WP[i], disp, dDx, dDy);
        }
        // Long swell, from a little off the wind
        wave(sea, uDir + 0.55, 70.0 * 0.70, 0.16 * 0.70, 0.2, 0.0, disp, dDx, dDy);
        disp *= fade;
        dDx *= fade;
        dDy *= fade;
        vec3 tx = vec3(1.0, 0.0, 0.0) + dDx;
        vec3 ty = vec3(0.0, 1.0, 0.0) + dDy;
        vNormalW = normalize(cross(tx, ty));
        // Horizontal compression: below ~0.6 the crest is about to break
        vJacobian = (1.0 + dDx.x) * (1.0 + dDy.y) - dDx.y * dDy.x;
        vHeight = disp.z / max(uAmp, 1e-3);
        vSea = sea + disp.xy;
        vDist = dist;
        vPos = vec3(local + disp.xy, disp.z);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPos, 1.0);
    }
`,tc=`
    uniform vec3 uZenith;
    uniform vec3 uHorizon;
    uniform vec3 uSunDir;
    uniform float uSunI;
    // Sky radiance in a direction (z up): horizon haze to zenith, a soft sun
    vec3 skyColor(vec3 d) {
        float up = clamp(d.z, 0.0, 1.0);
        vec3 c = mix(uHorizon, uZenith, pow(up, 0.45));
        float s = max(dot(d, uSunDir), 0.0);
        c += uSunI * (pow(s, 6.0) * 0.18 + pow(s, 120.0) * 0.6) * vec3(1.0, 0.94, 0.82);
        return c;
    }
`,td=`
    // Sin-free hash (Dave Hoskins): sin() of large arguments loses float
    // precision on the GPU and the noise falls apart into blocks far from
    // the session origin. Lattice wrapped to keep the inputs small.
    float hash(vec2 p) {
        vec3 p3 = fract(vec3(mod(p, 1024.0).xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }
    float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < FBM_OCTAVES; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.3); a *= 0.5; }
        return v;
    }
`,tm=`
    ${tl}
    ${tc}
    ${td}
    uniform vec3 uCam;
    uniform vec3 uDeep;
    uniform vec3 uScatter;
    uniform vec3 uFoamColor;
    uniform float uWind;
    uniform float uFog;
    uniform vec4 uTrail[32];
    uniform float uTrailReach;
    uniform vec2 uBow;
    uniform float uSpeed;
    uniform vec2 uHull;
    uniform float uOcclude;
    varying vec3 vPos;
    varying vec3 vNormalW;
    varying vec2 vSea;
    varying float vHeight;
    varying float vJacobian;
    varying float vDist;

    // Foam left by the hull: a turbulent band along our real track that
    // widens and fades with age, the two Kelvin arms (19.5\xb0) and the bow wave
    float wakeFoam(vec2 p) {
        if (length(p) > uTrailReach) return 0.0;
        float best = 1e6;
        float age = 0.0;
        for (int i = 0; i < TRAIL_SEGMENTS; i++) {
            vec4 a = uTrail[i];
            vec4 b = uTrail[i + 1];
            if (b.z < 0.0) break;
            vec2 ab = b.xy - a.xy;
            float t = clamp(dot(p - a.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
            float d = length(p - a.xy - ab * t);
            if (d < best) { best = d; age = mix(a.z, b.z, t); }
        }
        float moving = smoothstep(0.3, 1.6, uSpeed);
        float width = uHull.y * 0.55 + age * 0.12;
        float grain = fbm(vSea * 1.3 + vec2(0.0, uTime * 0.2));
        float band = (1.0 - smoothstep(width * 0.35, width, best)) * exp(-age / 22.0);
        band *= 0.45 + 0.75 * grain;

        // Boat frame: x ahead, y to port
        vec2 side = vec2(-uBow.y, uBow.x);
        float ahead = dot(p, uBow);
        float lat = dot(p, side);
        float behind = -ahead - uHull.x * 0.6;
        float arms = 0.0;
        if (behind > 0.0) {
            float off = abs(abs(lat) - uHull.y * 0.7 - behind * 0.354);
            float w = 0.2 + behind * 0.02;
            arms = (1.0 - smoothstep(0.0, w, off)) * exp(-behind / (10.0 + uSpeed * 5.0));
            // Broken, lacy foam rather than a painted line
            arms *= smoothstep(0.42, 0.75, fbm(vSea * 2.4 - vec2(uTime * 0.3))) * 0.7;
        }
        // Bow wave and the water pushed along the topsides
        float e = length(vec2(ahead / uHull.x, lat / uHull.y));
        float hug = smoothstep(1.45, 1.0, e) * smoothstep(0.92, 1.05, e) * (0.35 + 0.65 * smoothstep(-0.6, 0.9, ahead / uHull.x));
        hug *= 0.5 + 0.7 * fbm(vSea * 3.0 + vec2(uTime * 0.5));
        return clamp((band + arms + hug * 0.9) * moving, 0.0, 1.0);
    }

    void main() {
        // Seen through the water: only the hull's underwater part gets this pass
        vec2 bowP = vec2(dot(vPos.xy, uBow), dot(vPos.xy, vec2(-uBow.y, uBow.x)));
        float inHull = length(bowP / uHull);
        if (uOcclude > 0.5 && inHull > 1.02) discard;

        // Short wind waves and ripples, in the normal only, faded with distance
        // and wherever a pixel spans too much sea to show them (they would
        // sparkle from one frame to the next near the horizon)
        float footprint = length(fwidth(vSea));
        float detail = (1.0 - smoothstep(30.0, 260.0, vDist)) * (0.5 + 0.5 * uWind);
        vec2 grad = vec2(0.0);
        for (int i = 0; i < RIPPLES; i++) {
            float fi = float(i);
            float ang = uDir + (hash(vec2(fi, 3.7)) - 0.5) * 2.2;
            vec2 d = vec2(sin(ang), cos(ang));
            float L = uWaveLength * (0.22 - fi * 0.028);
            float k = 6.2831853 / L;
            float f = k * (dot(d, vSea) - sqrt(9.81 * 0.70 / k) * uTime) + fi * 1.9;
            grad += d * cos(f) * 0.07 * (1.0 - smoothstep(0.15, 0.4, footprint / L));
        }
        // Capillary texture: soft noise drifting downwind (wide finite
        // differences, so no value-noise cells show in the sun glitter),
        // faded out before it would alias into stripes
        vec2 drift = vec2(sin(uDir), cos(uDir)) * uTime * 0.6;
        mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
        vec2 q = rot * (vSea * 0.7) - drift;
        float e1 = fbm(q);
        float e2 = fbm(q + vec2(0.35, 0.0));
        float e3 = fbm(q + vec2(0.0, 0.35));
        grad += vec2(e2 - e1, e3 - e1) * 0.45 * (0.3 + 0.7 * uWind) * (1.0 - smoothstep(15.0, 90.0, vDist)) * (1.0 - smoothstep(0.12, 0.5, footprint));
        vec3 n = normalize(vNormalW - vec3(grad * detail, 0.0));

        vec3 v = normalize(uCam - vPos);
        float ndv = max(dot(n, v), 0.0);
        float fresnel = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
        vec3 r = reflect(-v, n);
        r.z = abs(r.z);
        vec3 refl = skyColor(r);

        // Water body: deep colour, light scattered through the crests (more
        // when looking towards the sun), slopes facing the sky a little lighter
        float h = clamp(vHeight * 0.5 + 0.5, 0.0, 1.0);
        vec2 look = normalize(-v.xy + 1e-5);
        vec2 sunH = normalize(uSunDir.xy + 1e-5);
        float towardSun = pow(clamp(dot(look, sunH) * 0.5 + 0.5, 0.0, 1.0), 3.0);
        float sss = h * h * (0.45 + 0.75 * towardSun) * (0.35 + 0.65 * uSunI);
        vec3 body = mix(uDeep, uScatter, clamp(sss, 0.0, 1.0));
        float diffuse = max(dot(n, uSunDir), 0.0);
        body *= 0.78 + 0.22 * n.z + 0.18 * diffuse * uSunI;
        vec3 color = mix(body, refl, fresnel);

        // Sun glitter: a sharp core and a broad sheen
        vec3 hv = normalize(uSunDir + v);
        float nh = max(dot(n, hv), 0.0);
        float spec = pow(nh, 500.0) * 2.2 + pow(nh, 70.0) * 0.18;
        color += uSunI * step(0.0, uSunDir.z) * spec * vec3(1.0, 0.95, 0.86);

        // White water: breaking crests from the wind, foam patches, our wake
        float grain = fbm(vSea * 0.55 + vec2(uTime * 0.05, 0.0));
        float streak = fbm(vec2(dot(vSea, vec2(cos(uDir), -sin(uDir))) * 0.35, dot(vSea, vec2(sin(uDir), cos(uDir))) * 0.06));
        float crest = smoothstep(0.82, 0.38, vJacobian) * smoothstep(-0.1, 0.6, vHeight);
        float caps = crest * smoothstep(0.35, 0.8, grain + crest * 0.45) * uWind;
        caps += smoothstep(0.66, 0.9, streak) * 0.18 * uWind * uWind * (1.0 - smoothstep(60.0, 250.0, vDist));
        float foam = clamp(caps * (1.0 - smoothstep(300.0, 900.0, vDist)) + wakeFoam(vPos.xy), 0.0, 1.0);
        vec3 foamLit = uFoamColor * (0.82 + 0.18 * diffuse * uSunI);
        color = mix(color, foamLit, foam);

        // Aerial perspective: the sea dissolves into the horizon haze
        float fog = 1.0 - exp(-pow(vDist * uFog, 1.4));
        vec3 haze = skyColor(normalize(vec3(normalize(vPos.xy - uCam.xy + 1e-4), 0.02)));
        color = mix(color, haze, clamp(fog, 0.0, 1.0));

        gl_FragColor = vec4(color, uOcclude > 0.5 ? 0.72 : 1.0);
        #include <colorspace_fragment>
    }
`,th=`
    varying vec3 vDir;
    void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,tf=`
    ${tc}
    uniform vec3 uDeep;
    varying vec3 vDir;
    void main() {
        // World is y up; the shared sky function is z up
        vec3 d = normalize(vec3(vDir.x, -vDir.z, vDir.y));
        vec3 color = skyColor(d);
        // Below the horizon (seen only past the sea's edge): the sea's own tone
        color = mix(color, mix(uHorizon, uDeep, 0.35), smoothstep(0.0, -0.06, d.z));
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
    }
`,tp=new d.Vector3,tv=()=>{let e=(0,y.useSignalKPaths)(["navigation.position"])["navigation.position"],[t,r]=(0,a.useState)(()=>({dir:new d.Vector3(.3,.6,.5).normalize(),intensity:1}));return(0,a.useEffect)(()=>{let t=()=>{let t=(0,D.sunPosition)(e?.latitude,e?.longitude,(0,k.vesselNow)()),a=t?t.elevation:35,o=(t?t.azimuth:200)*Math.PI/180,i=Math.max(a,4)*Math.PI/180;r({dir:new d.Vector3(Math.sin(o)*Math.cos(i),Math.cos(o)*Math.cos(i),Math.sin(i)).normalize(),intensity:d.MathUtils.smoothstep(a,-6,6)})};t();let a=setInterval(t,6e4);return()=>clearInterval(a)},[e?.latitude,e?.longitude]),t},tg=()=>{let{scene:e,id:r}=(0,N.default)(),{heading:o}=(0,W.default)(),i=tv(),n=(0,a.useMemo)(()=>({uZenith:{value:new d.Color},uHorizon:{value:new d.Color},uDeep:{value:new d.Color},uSunDir:{value:new d.Vector3},uSunI:{value:1}}),[]),s=(0,a.useMemo)(()=>new d.ShaderMaterial({uniforms:n,vertexShader:th,fragmentShader:tf,side:d.BackSide,depthWrite:!1,fog:!1}),[n]);return(0,a.useEffect)(()=>{n.uZenith.value.set(e.skyZenith),n.uHorizon.value.set(e.skyHorizon),n.uDeep.value.set(e.sea)},[n,e]),(0,c.useFrame)(()=>{let{x:e,y:t,z:a}=i.dir,s=Math.cos(o),l=Math.sin(o);n.uSunDir.value.set(e*s-t*l,-(-e*l-t*s),a).normalize(),n.uSunI.value=i.intensity*("day"===r?1:.06)}),(0,a.useEffect)(()=>()=>s.dispose(),[s]),(0,t.jsx)("mesh",{material:s,renderOrder:-3,frustumCulled:!1,children:(0,t.jsx)("sphereGeometry",{args:[3800,48,24]})})},tx=({y:e=-.3})=>{let{scene:r,id:o}=(0,N.default)(),{heading:i,offset:n}=(0,W.default)(),s=(0,y.useSignalKPaths)(ts),l=s["environment.wind.speedTrue"],u=s["environment.wind.directionTrue"],m=s["navigation.speedThroughWater"]??s["navigation.speedOverGround"],h=tv(),f=(0,a.useRef)(),p=(0,a.useRef)([]),v=(0,a.useMemo)(()=>({uTime:{value:0},uAmp:{value:.3},uDir:{value:0},uWaveLength:{value:15},uChop:{value:.6},uOffset:{value:new d.Vector2},uCam:{value:new d.Vector3},uSunDir:{value:new d.Vector3(.3,.6,.5).normalize()},uSunI:{value:1},uZenith:{value:new d.Color},uHorizon:{value:new d.Color},uDeep:{value:new d.Color},uScatter:{value:new d.Color},uFoamColor:{value:new d.Color},uWind:{value:.3},uFog:{value:1/2600},uTrail:{value:Array.from({length:32},()=>new d.Vector4(0,0,-1,0))},uTrailReach:{value:0},uBow:{value:new d.Vector2(0,1)},uSpeed:{value:0},uHull:{value:new d.Vector2(...tn)},uOcclude:{value:0}}),[]),g=(0,a.useMemo)(()=>{let e;return{FBM_OCTAVES:(e="pi"===(0,ti.getRenderProfile)().id)?2:4,RIPPLES:e?3:6,TRAIL_SEGMENTS:e?12:31}},[]),x=(0,a.useMemo)(()=>new d.ShaderMaterial({uniforms:v,defines:g,vertexShader:tu,fragmentShader:tm,depthWrite:!1}),[v,g]),M=(0,a.useMemo)(()=>new d.ShaderMaterial({uniforms:{...v,uOcclude:{value:1}},defines:g,vertexShader:tu,fragmentShader:tm,transparent:!0,depthWrite:!1}),[v,g]),b="day"===o?1:.06;(0,a.useEffect)(()=>{v.uDeep.value.set(r.sea),v.uScatter.value.set(r.seaScatter),v.uFoamColor.value.set(r.seaFoam),v.uZenith.value.set(r.skyZenith),v.uHorizon.value.set(r.skyHorizon)},[v,r]),(0,a.useEffect)(()=>{let e=Number.isFinite(l)?l:4,t=Math.min(.21*e*e/9.81,2.5);v.uAmp.value=.7*Math.max(.15,t),v.uChop.value=.4+.5*d.MathUtils.smoothstep(e,3,13),v.uWaveLength.value=.7*Math.min(55,Math.max(6,.5*e*e)),v.uWind.value=d.MathUtils.smoothstep(e,3.5,13),v.uDir.value=Number.isFinite(u)?u+Math.PI:Math.PI},[v,l,u]);let w=(0,a.useRef)({x:0,y:0,at:0,init:!1}),S=(0,a.useRef)({x:0,y:0});(0,a.useEffect)(()=>{w.current={x:.7*n.x,y:.7*n.y,at:performance.now()/1e3,init:!0}},[n]),(0,c.useFrame)((e,t)=>{let a=f.current;if(!a)return;let r=Math.min(t,.1);v.uTime.value+=r;let o=Number.isFinite(m)?m:0,n=Math.sin(i)*o*.7,s=Math.cos(i)*o*.7,l=w.current,u=S.current;if(l.init){let e=Math.min(3,performance.now()/1e3-l.at),t=l.x+n*e,a=l.y+s*e;Math.hypot(t-u.x,a-u.y)>40&&(u.x=t,u.y=a),u.x+=n*r+(t-u.x-n*r)*Math.min(1,3*r),u.y+=s*r+(a-u.y-s*r)*Math.min(1,3*r)}v.uOffset.value.set(u.x,u.y),a.updateWorldMatrix(!0,!1),v.uCam.value.copy(a.worldToLocal(tp.copy(e.camera.position))),v.uSunDir.value.copy(h.dir),v.uSunI.value=h.intensity*b;let c=e.clock.elapsedTime,d=p.current,g=d[0];g&&Math.hypot(u.x-g.x,u.y-g.y)>60&&(d.length=0),(!d[0]||Math.hypot(u.x-d[0].x,u.y-d[0].y)>1.5)&&(d.unshift({x:u.x,y:u.y,t:c}),d.length>36&&(d.length=36)),v.uSpeed.value=o,v.uBow.value.set(Math.sin(i),Math.cos(i));let x=.85*tn[0],y=v.uTrail.value;y[0].set(-Math.sin(i)*x,-Math.cos(i)*x,0,0);let M=1,C=x;for(let e of d){if(M>=32)break;let t=e.x-u.x,a=e.y-u.y;Math.hypot(t,a)<=x+.5||(y[M++].set(t,a,c-e.t,0),C=Math.max(C,Math.hypot(t,a)))}for(;M<32;M++)y[M].set(0,0,-1,0);v.uTrailReach.value=C+60}),(0,a.useEffect)(()=>()=>{x.dispose(),M.dispose()},[x,M]);let C=(0,a.useMemo)(()=>{let e=new d.PlaneGeometry(2,2,320,320),t=e.attributes.position,a=e=>2400*(.05*e+.95*e*e*e);for(let e=0;e<t.count;e++)t.setXY(e,a(t.getX(e)),a(t.getY(e)));return e},[]),j=(0,a.useMemo)(()=>new d.PlaneGeometry(2.4*tn[0],2.4*tn[0],48,48),[]);return(0,a.useEffect)(()=>()=>{C.dispose(),j.dispose()},[C,j]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(tg,{}),(0,t.jsxs)("group",{rotation:[0,i,0],position:[0,e,0],children:[(0,t.jsx)("mesh",{ref:f,rotation:[-Math.PI/2,0,0],geometry:C,material:x,renderOrder:-1,frustumCulled:!1}),(0,t.jsx)("mesh",{rotation:[-Math.PI/2,0,0],geometry:j,material:M,renderOrder:10,frustumCulled:!1})]})]})};var ty=e.i(3666),tM=e.i(88608);let tb=["navigation.position","environment.wind.speedTrue","environment.wind.directionTrue"],tw=({y:e=.05})=>{let r=(0,y.useSignalKPaths)(tb),o=r["navigation.position"],{heading:i}=(0,W.default)(),n=(0,a.useSyncExternalStore)(tM.subscribeForecast,tM.getForecastHour,tM.getForecastHour),[s,l]=(0,a.useState)(null),u=T.default.get("aisLengthScalingFactor")||.7,m=o?.latitude,h=o?.longitude,f=Number.isFinite(m)?`${m.toFixed(1)},${h.toFixed(1)}`:null,p=r["environment.wind.speedTrue"],v=r["environment.wind.directionTrue"];(0,a.useEffect)(()=>{if(!f)return;let e=!1,[t,a]=f.split(",").map(Number);return(0,ty.fetchWindField)(t,a).then(t=>{e||l(t)}).catch(()=>{!e&&Number.isFinite(p)&&Number.isFinite(v)&&l((0,ty.uniformField)(t,a,p,v))}),()=>{e=!0}},[f]);let g=(0,a.useMemo)(()=>{let e=new Uint8Array(65536),t=new d.DataTexture(e,128,128,d.RGBAFormat);return t.magFilter=d.LinearFilter,t.minFilter=d.LinearFilter,t.colorSpace=d.SRGBColorSpace,t},[]);(0,a.useEffect)(()=>{if(!s)return;let e=g.image.data;for(let t=0;t<128;t++)for(let a=0;a<128;a++){let r=(a/127*2-1)*ty.HALF_EXTENT_M,o=(t/127*2-1)*ty.HALF_EXTENT_M,i=(0,ty.sampleWind)(s,r,o,n),[l,u,c]=(0,ty.windColor)(Math.hypot(i.u,i.v)),d=(128*t+a)*4,m=Math.max(Math.abs(a/127*2-1),Math.abs(t/127*2-1));e[d]=l,e[d+1]=u,e[d+2]=c,e[d+3]=Math.round(255*Math.min(1,(1-m)*8))}g.needsUpdate=!0},[g,s,n]),(0,a.useEffect)(()=>()=>g.dispose(),[g]);let x=(0,a.useMemo)(()=>{let e=new Float32Array(10800),t=new d.BufferGeometry;return t.setAttribute("position",new d.BufferAttribute(e,3)),{geo:t,state:Array.from({length:1800},()=>({x:0,y:0,age:4*Math.random(),life:2+3*Math.random()}))}},[]),M=(0,a.useMemo)(()=>new d.LineBasicMaterial({color:0xffffff,transparent:!0,opacity:.75,depthWrite:!1}),[]);(0,a.useEffect)(()=>()=>{x.geo.dispose(),M.dispose()},[x,M]);let b=(0,a.useRef)({east:0,north:0});(0,a.useEffect)(()=>{let e,t;s&&Number.isFinite(m)&&(e=s.origin,b.current={east:((t={latitude:m,longitude:h}).longitude-e.lon)*Math.PI/180*6371e3*Math.cos(e.lat*Math.PI/180),north:(t.latitude-e.lat)*Math.PI/180*6371e3})},[s,m,h]);let w=(0,a.useRef)();if((0,c.useFrame)(({camera:e},t)=>{if(!s)return;if(w.current){let t=e.position.length()/u;w.current.opacity=d.MathUtils.clamp(.3+(t-300)/3e3*.3,.3,.6)}let a=Math.min(t,.1),r=Math.min(ty.HALF_EXTENT_M,Math.max(800,e.position.length()/u*2.5)),o=r/120,i=r/90,{east:l,north:c}=b.current,m=x.geo.attributes.position.array;x.state.forEach((e,t)=>{e.age+=a,(e.age>e.life||Math.abs(e.x)>r||Math.abs(e.y)>r)&&(e.x=(2*Math.random()-1)*r,e.y=(2*Math.random()-1)*r,e.age=0,e.life=2+3*Math.random());let d=(0,ty.sampleWind)(s,l+e.x,c+e.y,n),h=Math.hypot(d.u,d.v)||1;e.x+=d.u*o*a/10,e.y+=d.v*o*a/10;let f=i*Math.min(1.5,h/8),p=6*t;m[p]=e.x*u,m[p+1]=e.y*u,m[p+2]=.2,m[p+3]=(e.x-d.u/h*f)*u,m[p+4]=(e.y-d.v/h*f)*u,m[p+5]=.2}),x.geo.attributes.position.needsUpdate=!0}),!s)return null;let{east:S,north:C}=b.current,j=2*ty.HALF_EXTENT_M*u;return(0,t.jsx)("group",{rotation:[0,i,0],position:[0,e,0],children:(0,t.jsxs)("group",{rotation:[-Math.PI/2,0,0],children:[(0,t.jsxs)("mesh",{position:[-S*u,-C*u,0],renderOrder:1,children:[(0,t.jsx)("planeGeometry",{args:[j,j]}),(0,t.jsx)("meshBasicMaterial",{ref:w,map:g,transparent:!0,opacity:.6,depthWrite:!1,toneMapped:!1})]}),(0,t.jsx)("lineSegments",{geometry:x.geo,material:M,renderOrder:2,frustumCulled:!1})]})})};var tS=e.i(71415),tC=e.i(71029);let tj=["navigation.position","environment.current","environment.wind.speedTrue","environment.wind.directionTrue"],tP=({color:e})=>{let r=(0,a.useRef)();return(0,c.useFrame)(({clock:e})=>{r.current&&(r.current.position.y=.15*Math.sin(1.6*e.elapsedTime),r.current.rotation.z=.12*Math.sin(1.1*e.elapsedTime))}),(0,t.jsxs)("group",{ref:r,scale:1.6,children:[(0,t.jsxs)("mesh",{position:[0,.15,0],children:[(0,t.jsx)("capsuleGeometry",{args:[.32,.35,6,12]}),(0,t.jsx)("meshStandardMaterial",{color:e,roughness:.6})]}),(0,t.jsxs)("mesh",{position:[0,.85,0],children:[(0,t.jsx)("sphereGeometry",{args:[.22,16,12]}),(0,t.jsx)("meshStandardMaterial",{color:"#e9c8a8",roughness:.7})]}),(0,t.jsxs)("mesh",{position:[.32,.95,0],rotation:[0,0,-.35],children:[(0,t.jsx)("capsuleGeometry",{args:[.08,.55,4,8]}),(0,t.jsx)("meshStandardMaterial",{color:e,roughness:.6})]})]})},tT=()=>{let{t:e}=(0,ek.useTranslation)(),{scene:r}=(0,N.default)(),o=(0,tC.useActiveMobs)(),i=(0,y.useSignalKPaths)(tj),n=i["navigation.position"],[s,l]=(0,a.useState)(()=>(0,k.vesselNow)().getTime());(0,a.useEffect)(()=>{let e=setInterval(()=>l((0,k.vesselNow)().getTime()),1e3);return()=>clearInterval(e)},[]);let u=T.default.get("aisLengthScalingFactor")||.7,{heading:c}=(0,W.default)(),d=(0,a.useMemo)(()=>{let e=0,t=0,a=i["environment.current"];Number.isFinite(a?.drift)&&Number.isFinite(a?.setTrue)&&(e+=a.drift*Math.sin(a.setTrue),t+=a.drift*Math.cos(a.setTrue));let r=i["environment.wind.speedTrue"],o=i["environment.wind.directionTrue"];return Number.isFinite(r)&&Number.isFinite(o)&&(e-=.025*r*Math.sin(o),t-=.025*r*Math.cos(o)),{ve:e,vn:t}},[i]);return o.length&&Number.isFinite(n?.latitude)?(0,t.jsx)("group",{rotation:[0,c,0],children:o.filter(e=>Number.isFinite(e.position?.latitude)).map(a=>{let o,i=Math.max(0,(s-(Date.parse(a.createdAt)||s))/1e3),l={east:((o=a.position).longitude-n.longitude)*Math.PI/180*6371e3*Math.cos(n.latitude*Math.PI/180),north:(o.latitude-n.latitude)*Math.PI/180*6371e3},c={east:l.east+d.ve*i,north:l.north+d.vn*i},m={east:c.east+10*d.ve*60,north:c.north+10*d.vn*60},h=(e,t=.3)=>[e.east*u,t,-e.north*u],f=Math.hypot(c.east,c.north),p=Math.floor(i/60),v=Math.floor(i%60);return(0,t.jsxs)("group",{children:[(0,t.jsxs)("mesh",{position:h(l,.2),rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[1.6,2.2,32]}),(0,t.jsx)("meshBasicMaterial",{color:r.vesselDanger,transparent:!0,opacity:.7,depthWrite:!1})]}),(0,t.jsx)(J.Line,{points:[h(l),h(c)],color:r.vesselDanger,lineWidth:2.5}),(0,t.jsx)(J.Line,{points:[h(c),h(m)],color:r.vesselDanger,lineWidth:1.5,dashed:!0,dashSize:1.5,gapSize:1.2,transparent:!0,opacity:.7}),(0,t.jsx)(J.Line,{points:[[0,.3,0],h(c)],color:r.compass,lineWidth:1.2,dashed:!0,dashSize:2,gapSize:2,transparent:!0,opacity:.6}),(0,t.jsxs)("group",{position:h(c,0),children:[(0,t.jsx)(tP,{color:"#ff7a00"}),(0,t.jsxs)("mesh",{position:[0,.05,0],rotation:[-Math.PI/2,0,0],children:[(0,t.jsx)("ringGeometry",{args:[2.4,2.9,32]}),(0,t.jsx)("meshBasicMaterial",{color:r.vesselDanger,transparent:!0,opacity:.9,depthWrite:!1})]}),(0,t.jsx)(eY.Billboard,{position:[0,4.2,0],children:(0,t.jsx)(eV.Text,{fontSize:1.6,color:r.vesselDanger,anchorX:"center",anchorY:"bottom",font:"fonts/Roboto-Bold.ttf",outlineWidth:.12,outlineColor:r.background,children:`${e("mob.short","MOB")} \xb7 ${p}:${String(v).padStart(2,"0")} \xb7 ${Math.round(f)} m`})})]})]},a.path)})}):null};var tk=e.i(39271),tD=e.i(73919);let tF=()=>((0,c.useFrame)(({camera:e})=>{let t=Math.max(5,.05*e.position.length());Math.abs(t-e.near)>.1*e.near&&(e.near=t,e.updateProjectionMatrix())}),null);var tR=e.i(20440);let tz=["navigation.courseGreatCircle.nextPoint.bearingTrue","navigation.courseGreatCircle.nextPoint.distance","navigation.courseRhumbline.nextPoint.bearingTrue","navigation.courseRhumbline.nextPoint.distance"],tE=`
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,tA=`
    uniform vec3 uColor;
    uniform vec3 uGlow;
    uniform float uLength;
    uniform float uTime;
    uniform float uChevronZone;
    varying vec2 vUv;

    void main() {
        float along = vUv.y * uLength;
        float across = abs(vUv.x - 0.5) * 2.0;

        // Soft edges and a fade towards the far end
        float edge = 1.0 - smoothstep(0.75, 1.0, across);
        float farFade = 1.0 - smoothstep(0.55, 1.0, vUv.y);
        float alpha = 0.32 * edge * farFade;

        // Chevrons streaming forward near the bow
        // "+ across": the chevron tips point along the route, towards the waypoint
        float chevronCoord = along * 0.35 + across * 1.2 - uTime * 1.6;
        float chevron = smoothstep(0.55, 0.62, fract(chevronCoord)) * (1.0 - smoothstep(0.82, 0.9, fract(chevronCoord)));
        float zone = 1.0 - smoothstep(uChevronZone * 0.6, uChevronZone, along);
        vec3 color = mix(uColor, uGlow, chevron * zone);
        alpha += chevron * zone * 0.45 * edge;

        // Bright rim lines along both edges
        alpha += smoothstep(0.86, 0.94, across) * (1.0 - smoothstep(0.94, 1.0, across)) * 0.35 * farFade;

        gl_FragColor = vec4(color, alpha);

        #include <colorspace_fragment>
    }
`,tI=({y:e=-.2})=>{let{scene:r}=(0,N.default)(),{heading:o}=(0,W.default)(),i=(0,y.useSignalKPaths)(tz),n=i["navigation.courseGreatCircle.nextPoint.bearingTrue"]??i["navigation.courseRhumbline.nextPoint.bearingTrue"],s=i["navigation.courseGreatCircle.nextPoint.distance"]??i["navigation.courseRhumbline.nextPoint.distance"],l=T.default.get("aisLengthScalingFactor")||.7,u=Number.isFinite(s)?Math.min(s*l,1600):0,m=Number.isFinite(s)&&s*l<=1600,h=(0,a.useMemo)(()=>new d.ShaderMaterial({uniforms:{uColor:{value:new d.Color},uGlow:{value:new d.Color},uLength:{value:1},uTime:{value:0},uChevronZone:{value:45}},vertexShader:tE,fragmentShader:tA,transparent:!0,depthWrite:!1}),[]);return((0,a.useEffect)(()=>{h.uniforms.uColor.value.set(r.route),h.uniforms.uGlow.value.set(r.routeGlow)},[h,r]),(0,a.useEffect)(()=>{h.uniforms.uLength.value=Math.max(u,1)},[h,u]),(0,a.useEffect)(()=>()=>h.dispose(),[h]),(0,c.useFrame)((e,t)=>{h.uniforms.uTime.value+=t}),!Number.isFinite(n)||u<1)?null:(0,t.jsx)("group",{rotation:[0,o,0],position:[0,e,0],children:(0,t.jsxs)("group",{rotation:[0,-n,0],children:[(0,t.jsx)("mesh",{position:[0,0,-u/2],rotation:[-Math.PI/2,0,0],material:h,renderOrder:1,children:(0,t.jsx)("planeGeometry",{args:[3.2,u,1,1]})}),m&&(0,t.jsxs)("group",{position:[0,0,-u],children:[(0,t.jsxs)("mesh",{position:[0,4,0],children:[(0,t.jsx)("cylinderGeometry",{args:[.12,.12,8,8]}),(0,t.jsx)("meshBasicMaterial",{color:r.route})]}),(0,t.jsxs)("mesh",{position:[0,8.6,0],children:[(0,t.jsx)("sphereGeometry",{args:[.9,16,16]}),(0,t.jsx)("meshBasicMaterial",{color:r.route})]}),(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,0],position:[0,.05,0],children:[(0,t.jsx)("ringGeometry",{args:[2.4,3.2,40]}),(0,t.jsx)("meshBasicMaterial",{color:r.route,transparent:!0,opacity:.7,depthWrite:!1})]})]})]})})},tW=(e,t,a)=>Number.isFinite(e)?e<.8?a.copy(t.bad):e<.95?a.copy(t.fair):a.copy(t.good):a.copy(t.foam),tG=({y:e=-.25})=>{let{scene:r}=(0,N.default)(),{heading:o,offset:i}=(0,W.default)(),{ratio:n}=(0,eq.default)(),s=(0,a.useRef)([]),l=(0,a.useRef)(0),u=T.default.get("aisLengthScalingFactor")||.7,c=(0,a.useMemo)(()=>({good:new d.Color(r.wakeGood),fair:new d.Color(r.wakeFair),bad:new d.Color(r.wakeBad),foam:new d.Color(r.wakeFoam)}),[r]),m=(0,a.useMemo)(()=>{let e=new d.BufferGeometry;e.setAttribute("position",new d.BufferAttribute(new Float32Array(2160),3)),e.setAttribute("color",new d.BufferAttribute(new Float32Array(2880),4));let t=[];for(let e=0;e<359;e++){let a=2*e;t.push(a,a+1,a+2,a+1,a+3,a+2)}return e.setIndex(t),e.setDrawRange(0,0),e},[]),h=(0,a.useMemo)(()=>new d.MeshBasicMaterial({vertexColors:!0,transparent:!0,depthWrite:!1,side:d.DoubleSide}),[]);return(0,a.useEffect)(()=>()=>{m.dispose(),h.dispose()},[m,h]),(0,a.useEffect)(()=>{let e=Date.now(),t=s.current,a=t[t.length-1];if(e-l.current<1e3||a&&.5>Math.hypot(i.x-a.x,i.y-a.y))return;l.current=e;let r=Number.isFinite(n)?n:a?.ratio;for(t.push({x:i.x,y:i.y,ratio:r});t.length>360;)t.shift();let o=0;for(let e=t.length-1;e>0;e--)if((o+=Math.hypot(t[e].x-t[e-1].x,t[e].y-t[e-1].y))>900){t.splice(0,e-1);break}},[i,n]),(0,a.useEffect)(()=>{let e=s.current,t=m.attributes.position.array,a=m.attributes.color.array,r=new d.Color,o=e[e.length-1]?.ratio,l=[...e,{x:i.x,y:i.y,ratio:Number.isFinite(n)?n:o}],h=Math.min(l.length,360),f=l.length-h,p=l.some(e=>Number.isFinite(e.ratio));for(let e=0;e<h;e++){let o=l[f+e],n=l[Math.max(f,f+e-1)],s=l[Math.min(l.length-1,f+e+1)],d=s.x-n.x,m=s.y-n.y,v=Math.hypot(d,m)||1;d/=v,m/=v;let g=(o.x-i.x)*u,x=-(o.y-i.y)*u,y=-(.9*m),M=-(.9*d);t.set([g+y,0,x+M,g-y,0,x-M],6*e);let b=1-e/Math.max(1,h-1),w=!Number.isFinite(o.ratio)&&p?0:.5*(1-b)**.7;tW(o.ratio,c,r),a.set([r.r,r.g,r.b,w,r.r,r.g,r.b,w],8*e)}m.attributes.position.needsUpdate=!0,m.attributes.color.needsUpdate=!0,m.setDrawRange(0,Math.max(0,(h-1)*6)),m.computeBoundingSphere()},[m,i,n,c,u]),(0,t.jsx)("group",{rotation:[0,o,0],position:[0,e,0],children:(0,t.jsx)("mesh",{geometry:m,material:h,frustumCulled:!1,renderOrder:1})})};var tN=e.i(47167),tL=e.i(78140);let tB=tN.default.env.ASSET_PREFIX||"./",t_=`${tB}/boats/default/assets/scene-transformed.glb`,tO=({scale:e=.7})=>{let{scene:r}=(0,N.default)(),{polarSpeed:o,boatSpeed:i}=(0,eq.default)(),{nodes:n}=(0,tL.useGLTF)(t_,`${tB}/draco/`),s=(0,a.useRef)(),l=(0,a.useRef)(0),u=(0,a.useRef)({polarSpeed:o,boatSpeed:i}),m=T.default.get("aisLengthScalingFactor")||.7;(0,a.useEffect)(()=>{u.current={polarSpeed:o,boatSpeed:i}},[o,i]);let h=(0,a.useMemo)(()=>new d.MeshLambertMaterial({transparent:!0,opacity:.28,depthWrite:!1}),[]);if((0,a.useEffect)(()=>{h.color.set(r.ghost)},[h,r]),(0,a.useEffect)(()=>()=>h.dispose(),[h]),(0,c.useFrame)((e,t)=>{let{polarSpeed:a,boatSpeed:r}=u.current,o=Math.min(t,.5),i=Math.exp(-o/60),n=Number.isFinite(a)&&Number.isFinite(r)?(a-r)*o*m:0;l.current=d.MathUtils.clamp(l.current*i+n,-70,70),s.current&&(s.current.position.z=-l.current,s.current.visible=Math.abs(l.current)>2)}),!Number.isFinite(o))return null;let f=[["govde_fiberglass_0",[0,.32,-.897],[0,Math.PI/2,0],[5.11,.454,1.212]],["govde_fiberglass2_0",[0,.32,-.897],[0,Math.PI/2,0],[5.11,.454,1.212]],["ustgovde_fiberglass_0",[0,.832,-2.741],[-Math.PI/2,0,0],[.566,.7,1.212]],["salma_fiberglass_0",[0,-1.953,-.739],[0,0,0],[.149,.108,.756]],["direk_fiberglass_0",[0,4.315,-1.056],[Math.PI/2,0,Math.PI],[-.113,.113,5.203]]];return(0,t.jsx)("group",{ref:s,scale:[e,e,e],visible:!1,children:f.map(([e,a,r,o])=>n[e]&&(0,t.jsx)("mesh",{geometry:n[e].geometry,material:h,position:a,rotation:r,scale:o,renderOrder:2},e))})};var tU=e.i(83524),tV=e.i(92554);let tH=()=>{let{t:e}=(0,ek.useTranslation)(),{scene:a}=(0,N.default)(),r=(0,tU.default)();if(!r||"standOn"===r.kind||null===r.change)return null;let o=[90*Math.sin(r.change),-(90*Math.cos(r.change))],i="avoid"===r.kind?a.vesselDanger:a.target;return(0,t.jsxs)("group",{children:[(0,t.jsx)(e5,{from:[0,-4],to:o,color:i,width:2,opacity:.28,fadeTo:!0,y:-.1}),(0,t.jsx)(eY.Billboard,{position:[.45*o[0],4,.45*o[1]],children:(0,t.jsx)(eV.Text,{fontSize:1.5,color:i,anchorX:"center",anchorY:"bottom",font:"fonts/Roboto-Bold.ttf",outlineWidth:.04,outlineColor:a.background,children:(0,tV.formatAdvice)(r,e)})})]})},tZ=({angle:e,color:a,label:r})=>{let o=7.2*Math.sin(e),i=-(7.2*Math.cos(e));return(0,t.jsxs)("group",{position:[o,.05,i],rotation:[0,-e,0],children:[(0,t.jsxs)("mesh",{rotation:[-Math.PI/2,0,Math.PI],children:[(0,t.jsx)("circleGeometry",{args:[.45,3]}),(0,t.jsx)("meshBasicMaterial",{color:a})]}),(0,t.jsx)(eV.Text,{position:[0,.02,-.9],rotation:[-Math.PI/2,0,0],fontSize:.42,color:a,anchorX:"center",anchorY:"middle",font:"fonts/Roboto-Bold.ttf",children:r})]})},t$=()=>{let{scene:e}=(0,N.default)(),{heading:a,targetHeading:r,vmc:o}=(0,eq.default)();return Number.isFinite(a)?(0,t.jsxs)("group",{children:[Number.isFinite(r)&&(0,t.jsx)(tZ,{angle:(0,eJ.wrapPi)(r-a),color:e.target,label:"TWA"}),o?.best&&(0,t.jsx)(tZ,{angle:(0,eJ.wrapPi)(o.best.heading-a),color:e.route,label:"VMG"})]}):null},tK={mainCar:.5,jibCar:.5,tension:.5,reefLevel:0};var tX=e.i(5941);let tY=[{label:"GV",centerDeg:180,colorKey:"accent",key:"mainCar",mode:"position"},{label:"FP",centerDeg:260,colorKey:"ok",key:"jibCar",side:"port",mode:"fill"},{label:"FS",centerDeg:100,colorKey:"danger",key:"jibCar",side:"starboard",mode:"fill"}];function tq(e,t){let a=d.MathUtils.degToRad(e-90);return[t*Math.cos(a),t*Math.sin(a)]}let tJ=({label:e,value:r,centerDeg:o,color:i,dim:n})=>{let s=Math.max(0,Math.min(1,r)),l=(0,a.useMemo)(()=>{let e=[],a=o-15;for(let r=0;r<=12;r++){let o=r/12,[l,u]=tq(a+30*o,4.2),c=Math.abs(o-s),d=c<=.041666666666666664,m=c<=.125,h=.041666666666666664>=Math.abs(o-.5),f=n,p=.09,v=.3;d?(f=i,p=.16,v=1):m?(f=i,p=.09,v=.5):h&&(v=.5),e.push((0,t.jsx)(eO,{args:[p,8,8],position:[l,0,u],children:(0,t.jsx)("meshBasicMaterial",{color:f,transparent:!0,opacity:v})},r))}return e},[s,o,i,n]),u=d.MathUtils.degToRad(o-90),c=3.6*Math.cos(u),m=3.6*Math.sin(u);return(0,t.jsxs)("group",{children:[l,(0,t.jsx)(eV.Text,{position:[c,-.4,m],color:i,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-u],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:.9,children:e})]})},tQ=({label:e,value:r,centerDeg:o,color:i,active:n,dim:s,disabled:l})=>{let u=Math.max(0,Math.min(1,r)),c=(0,a.useMemo)(()=>{let e=[],a=o-15;for(let r=0;r<=12;r++){let o=r/12,[c,d]=tq(a+30*o,4.2),m=l,h=.09,f=.15;if(n){let e=o<=u;.041666666666666664>=Math.abs(o-u)?(m=i,h=.16,f=1):e?(m=i,f=.7):(m=s,f=.3)}e.push((0,t.jsx)(eO,{args:[h,8,8],position:[c,0,d],children:(0,t.jsx)("meshBasicMaterial",{color:m,transparent:!0,opacity:f})},r))}return e},[u,o,i,n,s,l]),m=d.MathUtils.degToRad(o-90),h=3.6*Math.cos(m),f=3.6*Math.sin(m);return(0,t.jsxs)("group",{children:[c,(0,t.jsx)(eV.Text,{position:[h,-.4,f],color:n?i:l,fontSize:.3,rotation:[-Math.PI/2,0,Math.PI/2-m],font:"fonts/Roboto-Bold.ttf",anchorY:"middle",fillOpacity:n?.9:.2,children:e})]})},t0=()=>{let e=(0,N.default)(),r=(0,y.useSignalKPath)("environment.wind.angleApparent",0),o=(0,y.useSignalKPath)("environment.wind.speedApparent",0),i=(0,a.useMemo)(()=>{let e=r;for(;e<0;)e+=2*Math.PI;for(;e>=2*Math.PI;)e-=2*Math.PI;return e>Math.PI},[r]),{mainCar:n,jibCar:s}=(0,a.useMemo)(()=>(function(e,t){let a=e;for(;a<0;)a+=2*Math.PI;for(;a>=2*Math.PI;)a-=2*Math.PI;let r=a>Math.PI,o=Math.max(0,1-(r?2*Math.PI-a:a)/(.75*Math.PI)),i=Math.min(1,Math.abs(t)/15),n=(1-o)*.4*i;return{mainCar:r?.5-n:.5+n,jibCar:Math.max(.05,Math.min(1,(1-o)*.7+.2*i+.1))}})(r,o),[r,o]);return(0,t.jsx)("group",{children:tY.map(a=>{let r="mainCar"===a.key?n:s,o=!0;return("port"===a.side&&(o=!i),"starboard"===a.side&&(o=i),"position"===a.mode)?(0,t.jsx)(tJ,{label:a.label,value:r,centerDeg:a.centerDeg,color:e[a.colorKey],dim:e.scene.markerDim},a.label):(0,t.jsx)(tQ,{label:a.label,value:r,centerDeg:a.centerDeg,color:e[a.colorKey],active:o,dim:e.scene.markerDim,disabled:e.scene.grid},a.label)})})};e.s(["default",0,({onUpdateInfoPanel:e})=>{let{states:s}=(0,g.useOcearoContext)(),{scene:l,id:u}=(0,N.default)(),c=(0,a.useRef)(),d=(0,tk.useReplay)().active,m=T.default.get("debugShowAxes"),h=(()=>{let e,[t,r]=(0,a.useState)(tK),o=T.default.get("preferredWindSpeedPath")||"speedTrue",i=T.default.get("preferredWindDirectionPath")||"angleTrueWater",n=(0,a.useMemo)(()=>[`environment.wind.${o}`,`environment.wind.${i}`,"environment.wind.speedTrue","environment.wind.angleTrueWater","environment.wind.angleApparent","environment.wind.speedApparent","environment.wind.directionTrue","environment.wind.angleTrueGround","navigation.headingTrue","navigation.courseOverGroundTrue"],[o,i]),s=(0,y.useSignalKPaths)(n),l=s[`environment.wind.${o}`]??s["environment.wind.speedTrue"]??0,u=s["navigation.headingTrue"]??s["navigation.courseOverGroundTrue"],c=s["environment.wind.directionTrue"],d=s["environment.wind.angleTrueWater"]??s["environment.wind.angleTrueGround"]??(Number.isFinite(c)&&Number.isFinite(u)?Math.atan2(Math.sin(e=c-u),Math.cos(e)):0),m=s["environment.wind.angleApparent"]??0,h=s["environment.wind.speedApparent"]??0,f=(0,a.useCallback)((e,t)=>{r(a=>({...a,[e]:t}))},[]),p=(0,a.useCallback)(e=>{f("mainCar",e)},[f]),v=(0,a.useCallback)(e=>{f("jibCar",e)},[f]),g=(0,a.useCallback)(e=>{f("tension",e)},[f]),x=(0,a.useCallback)(e=>{let t=1.9438444924574*e;return t>25?2:+(t>18)},[]),M=(0,a.useMemo)(()=>x(l),[l,x]),b=(0,a.useMemo)(()=>({tws:l,twa:d,awa:m,aws:h}),[l,d,m,h]),w=(0,a.useMemo)(()=>({...t,reefLevel:M,...b}),[t,M,b]);return{trimState:t,windData:b,reefLevel:M,sailTrimParams:w,setMainCar:p,setJibCar:v,setTension:g,setTrimValue:f}})(),f=(0,a.useMemo)(()=>({...(0,tX.updateSailTrim)({tws:h.windData.tws,twa:h.windData.twa,awa:h.windData.awa,mainCar:h.trimState.mainCar,jibCar:h.trimState.jibCar,tension:h.trimState.tension}),trimState:h.trimState,windData:h.windData}),[h.windData,h.trimState]);return(0,t.jsxs)(a.Suspense,{fallback:(0,t.jsx)(i.Html,{children:"Loading..."}),children:[(0,t.jsx)(o.PerspectiveCamera,{makeDefault:!0,fov:60,near:5,far:"meteo"===s.oceanMode?6e4:6e3,position:[0,5,20]}),(0,t.jsx)(tF,{}),(0,t.jsx)(r.OrbitControls,{enableZoom:!0,enableRotate:!0,maxPolarAngle:Math.PI/2,minPolarAngle:Math.PI/4,enableDamping:!1,zoomSpeed:.5,rotateSpeed:.5}),(0,t.jsx)(tD.default,{backdrop:"black"===s.oceanMode||"water"===s.oceanMode,fogNear:600,fogFar:4200,fogColor:"water"===s.oceanMode?l.skyHorizon:void 0}),(0,t.jsxs)("group",{position:[0,-3,0],children:[(0,t.jsx)(n.default,{position:[0,.2*("chart"===s.oceanMode||"depth"===s.oceanMode||"meteo"===s.oceanMode),0],scale:[.7,.7,.7],ref:c,showSail:!0,onUpdateInfoPanel:e,sailTrimData:f}),!1!==T.default.get("showGhostBoat")&&(0,t.jsx)(tO,{scale:.7}),"water"===s.oceanMode&&(0,t.jsx)(tx,{}),("chart"===s.oceanMode||"depth"===s.oceanMode||"meteo"===s.oceanMode)&&(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(tg,{}),(0,t.jsx)(A,{lite:!0,sky:!1,horizon:l.skyHorizon,liteColor:"day"===u?0xb4cbd1:l.sea,fogDensity:"meteo"===s.oceanMode?3e-5:void 0,water:"depth"!==s.oceanMode})]}),"depth"===s.oceanMode&&(0,t.jsx)(tS.default,{}),"depth"===s.oceanMode&&(0,t.jsx)(q,{mode:"chart",opacity:.2}),"meteo"===s.oceanMode&&(0,t.jsx)(tw,{}),"chart"===s.oceanMode&&(0,t.jsx)(q,{mode:"chart"}),"meteo"===s.oceanMode&&(0,t.jsx)(q,{mode:"meteo"}),"black"===s.oceanMode&&(0,t.jsx)(tR.default,{}),(0,t.jsx)(tI,{}),(0,t.jsx)(tG,{}),s.showLaylines3D&&(0,t.jsx)(e6,{}),(0,t.jsx)(tH,{}),s.showPolar&&"black"===s.oceanMode&&(0,t.jsx)(to,{}),(0,t.jsx)(tT,{}),s.ais&&!d&&(0,t.jsx)(eL,{onUpdateInfoPanel:e}),(0,t.jsx)(eX,{visible:!0}),(0,t.jsx)(t$,{}),!1!==T.default.get("showSailTrimSliders")&&(0,t.jsx)(t0,{})]}),m&&(0,t.jsx)("axesHelper",{args:[100]})]})}],67225)},59465,function(e){e.n(e.i(67225))}]);