import * as T from "three";
import { expressions } from "./avatar-face";
import type { Collection } from "../engine/avatar";

// The atlas cells are registered orthographic head paintings. Only their
// central facial area is projected; ears, temples and the back use skin.
const paints = {
  indonesia: ["", "#fdd5be", "#fdd7c3"],
  tiongkok: ["-tiongkok", "#fcd2bc", "#fcd6c2"],
  amerika: ["-amerika", "#fed0b6", "#fed1b8"],
  australia: ["-australia", "#fdd1b2", "#fed2b9"],
  afrika: ["-umber", "#cb703e", "#d07442"],
  defined: ["-defined", "#f5b894", "#f7bd9d"],
  umberDefined: ["-umber-defined", "#c77046", "#cb744a"],
} as const;

export function faceArt(
  collection: Collection,
  female: boolean,
  index: number,
) {
  const umber =
    collection === "afrika" ||
    (collection === "amerika" &&
      (female ? [1, 5].includes(index) : index === 3));
  const defined = female ? [3, 5].includes(index) : index >= 4;
  const design = defined
    ? umber
      ? "umberDefined"
      : "defined"
    : umber
      ? "afrika"
      : collection;
  const [suffix, maleBase, femaleBase] = paints[design];
  return {
    src: `/avatar-materials/face-paint${suffix}.webp`,
    base: female ? femaleBase : maleBase,
  };
}

export function facePaint(
  atlas: T.Texture,
  collection: string,
  female: boolean,
  index: number,
  base: string,
  skin: string,
  hair: string,
  eyes: number,
  spacing: number,
  mouth: number,
  nose: number,
) {
  const expression =
    (expressions[collection] ?? expressions.indonesia)[female ? 1 : 0][index] ??
    "gentle";
  const open =
    expression === "laugh" || expression === "bright" || expression === "wink";
  return new T.ShaderMaterial({
    lights: true,
    fog: true,
    uniforms: {
      ...T.UniformsUtils.clone(T.UniformsLib.lights),
      ...T.UniformsUtils.clone(T.UniformsLib.fog),
      paint: { value: atlas },
      complexion: { value: new T.Color(skin) },
      paintBase: { value: new T.Color(base) },
      browInk: { value: new T.Color(hair) },
      female: { value: Number(female) },
      poseColumn: { value: expression === "laugh" ? 2 : open ? 1 : 0 },
      wink: { value: Number(expression === "wink") },
      smirk: { value: Number(expression === "smirk") },
      eyeSize: {
        value: eyes * [1, 0.95, 1.045, 0.99, 0.925, 1.025, 0.96][index % 7],
      },
      eyeSpacing: {
        value: spacing * [1, 1.025, 0.995, 1.03, 0.98, 0.97, 1.01][index % 7],
      },
      mouthSize: { value: mouth },
      noseSize: { value: nose },
    },
    vertexShader: `
      #include <fog_pars_vertex>
      attribute float paintVisibility;
      varying vec2 vFace;
      varying float vCoverage;
      varying vec3 vNormal;
      void main() {
        vFace = uv;
        vCoverage = paintVisibility;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      #include <common>
      #include <lights_pars_begin>
      #include <fog_pars_fragment>
      uniform sampler2D paint;
      uniform vec3 complexion, paintBase, browInk;
      uniform float female, poseColumn, wink, smirk, eyeSize, eyeSpacing, mouthSize, noseSize;
      varying vec2 vFace;
      varying float vCoverage;
      varying vec3 vNormal;
      float band(float x, float low, float high, float feather) {
        return smoothstep(low-feather, low, x) * (1.-smoothstep(high, high+feather, x));
      }
      void main() {
        float row = vFace.y;
        float eyeLine = mix(.433,.452,female);
        float noseLine = mix(.626,.635,female);
        float lipLine = mix(.71,.718,female);
        float y;
        if (row < .5) y = mix(.014, eyeLine, row/.5);
        else if (row < .64) y = mix(eyeLine, noseLine, (row-.5)/.14);
        else if (row < .756) y = mix(noseLine, lipLine, (row-.64)/.116);
        else y = mix(lipLine, .929, (row-.756)/.244);
        float x = vFace.x * .299;
        float ax = abs(x);
        float eyeBand = band(y,eyeLine-.092,eyeLine+.044,.037) * smoothstep(.012,.065,ax);
        float eyeCenter = .149;
        float eyeX = sign(x) * ((ax-eyeCenter*eyeSpacing*.91)/(eyeSize*.90)+eyeCenter);
        x = mix(x,eyeX,eyeBand);
        y = mix(y,eyeLine+(y-eyeLine)/(eyeSize*1.20),eyeBand);
        float noseBand = band(y,noseLine-.068,noseLine+.014,.036)*(1.-smoothstep(.07,.145,abs(x)));
        x /= mix(1.,noseSize*.86,noseBand);
        float mouthBand = band(y,lipLine-.018,lipLine+.12,.037);
        x /= mix(1.,mouthSize*.89,mouthBand);
        y += smirk * mouthBand * smoothstep(-.08,.14,x)*.015;
        float column = (wink>.5 && x>.005 && y<eyeLine+.080) ? 2. : poseColumn;
        // The second and third cells have a slight centre offset in the paintings.
        vec2 cell = vec2(.507 + x, y);
        vec2 source = vec2((column+cell.x)/3., 1.-(female+cell.y)/2.);
        vec3 pigment = sRGBTransferEOTF(texture2D(paint, source)).rgb;
        // Recolour pigment in linear light, retaining white sclera/teeth,
        // dark line work and the painted catchlights.
        float paper = smoothstep(.10,.42,pigment.r / paintBase.r) * smoothstep(.032,.18,(pigment.r-pigment.b)/paintBase.r);
        float feature = max(band(y,eyeLine-.040,eyeLine+.040,.020)*band(abs(x),.068,.225,.020),
                            band(y,lipLine-.035,lipLine+.059,.015)*(1.-smoothstep(.095,.14,abs(x))));
        float sourceChroma = (paintBase.r-paintBase.b)/paintBase.r;
        float chroma = (pigment.r-pigment.b)/max(.01,pigment.r);
        float ivory = (1.-smoothstep(.60,.93,chroma/sourceChroma))*smoothstep(.57,.90,pigment.r/paintBase.r);
        paper *= 1.-feature*ivory;
        vec3 recolored = mix(pigment, pigment * complexion / paintBase, paper);
        float brow = band(y,eyeLine-.115,eyeLine-.055,.025) * smoothstep(.035,.085,abs(x));
        float line = 1.-smoothstep(.065,.30,pigment.r/paintBase.r);
        recolored = mix(recolored, recolored*.64 + browInk*.34, brow*line*.78);
        // Exclude the painted outline and the grey backdrop. The mesh provides
        // its own cheek, jaw and silhouette when seen from the side.
        float cheekWidth = .279 - .050*smoothstep(.49,.65,y) - .069*smoothstep(.64,.81,y) - .093*smoothstep(.78,.90,y);
        float coverage = vCoverage * (1.-smoothstep(cheekWidth-.033,cheekWidth,abs(x))) * band(y,.105,.853,.041);
        vec3 albedo = mix(complexion,recolored,coverage);
        vec3 n = normalize(vNormal);
        float lambert = dot(n,normalize(vec3(-.32,.55,1.)));
        float light = .77 + .24*smoothstep(-.22,.64,lambert);
        vec3 illumination = ambientLightColor;
        #if NUM_HEMI_LIGHTS > 0
          illumination += hemisphereLights[0].skyColor * .60;
        #endif
        #if NUM_DIR_LIGHTS > 0
          for (int k = 0; k < NUM_DIR_LIGHTS; k++) {
            illumination += directionalLights[k].color * (.16+.54*max(dot(n,directionalLights[k].direction),0.));
          }
        #endif
        vec3 daylight = mix(vec3(.57,.59,.63), vec3(1.), smoothstep(vec3(.12),vec3(1.32),illumination));
        gl_FragColor = vec4(albedo*light*daylight,1.);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
}
