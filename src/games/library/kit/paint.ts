import * as THREE from 'three';

/**
 * The painterly material.
 *
 * The look wanted here is a hand-painted diorama: soft rounded forms, a warm
 * key and a cool shadow, a bright rim where a silhouette turns away, and no
 * hard specular anywhere. The obvious way to get it is to write the whole
 * lighting model in a `ShaderMaterial` — and the obvious way is wrong, because
 * you immediately lose shadow maps, fog, tone mapping and the environment, and
 * spend the rest of the build putting them back.
 *
 * So the shading stays three.js's own and the *result* is graded. Everything
 * this needs — the shaded colour, the view-space normal, the vector to the eye
 * — is already in scope at `opaque_fragment`, so the patch is one injection
 * into the fragment shader and nothing in the vertex shader at all.
 */

export interface PaintOptions {
  colour: THREE.ColorRepresentation;
  /** Tint applied where the surface is dark. Blue-grey reads as shadow. */
  cool?: THREE.ColorRepresentation;
  /** Tint applied where it is lit. */
  warm?: THREE.ColorRepresentation;
  /** How hard the light-to-shadow transition is. 0 is smooth, 1 is a poster. */
  band?: number;
  rim?: THREE.ColorRepresentation;
  rimStrength?: number;
  rimPower?: number;
  roughness?: number;
  /** Light picked up from above — grass on a rock top, snow on a roof. */
  sky?: THREE.ColorRepresentation;
  skyStrength?: number;
  flatShading?: boolean;
  transparent?: boolean;
  opacity?: number;
}

const PATCH = /* glsl */ `
  {
    float pLum = dot( outgoingLight, vec3( 0.2126, 0.7152, 0.0722 ) );

    // Push the midtones about so the ramp reads as a painted one: a soft
    // S-curve mixed back into the true value, rather than a hard posterisation
    // that would throw away the modelling the lights just did.
    float pShaped = mix( pLum, smoothstep( 0.04, 0.78, pLum ), uPaintBand );

    // Warm where it is lit, cool where it is not. This is the whole trick.
    vec3 pGrade = mix( uPaintCool, uPaintWarm, clamp( pShaped, 0.0, 1.0 ) );
    outgoingLight *= pGrade;

    // Light from the sky, which is what stops an upward face going grey.
    outgoingLight += uPaintSky * uPaintSkyK * max( normal.y, 0.0 ) * diffuseColor.rgb;

    // The rim. Fresnel against the eye, so it lands exactly where a form turns
    // away — the edge that separates one rock from the one behind it.
    //
    // Tied to the surface's own colour *and* to how lit it already is. An
    // additive rim that ignores both is fine in daylight and ruinous at night:
    // on an unlit wall it becomes the only thing in the pixel, and a dark room
    // comes out as a neon wireframe of itself. Half of it follows the albedo,
    // half follows the light actually falling on the surface.
    float pRim = pow( 1.0 - clamp( dot( normal, normalize( vViewPosition ) ), 0.0, 1.0 ), uPaintRimP );
    outgoingLight += uPaintRim * uPaintRimK * pRim * diffuseColor.rgb * ( 0.35 + 0.65 * clamp( pLum * 3.0, 0.0, 1.0 ) );
  }
`;

const HEAD = /* glsl */ `
  uniform vec3 uPaintCool;
  uniform vec3 uPaintWarm;
  uniform vec3 uPaintRim;
  uniform vec3 uPaintSky;
  uniform float uPaintBand;
  uniform float uPaintRimK;
  uniform float uPaintRimP;
  uniform float uPaintSkyK;
`;

/**
 * A painted surface.
 *
 * Returns a real `MeshStandardMaterial`, so it casts and receives shadows,
 * takes the environment and the fog, and can be used anywhere an ordinary
 * material can.
 */
export function paint(o: PaintOptions): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color: new THREE.Color(o.colour),
    roughness: o.roughness ?? 0.95,
    metalness: 0,
    flatShading: o.flatShading ?? false,
    transparent: o.transparent ?? false,
    opacity: o.opacity ?? 1,
  });

  const u = {
    uPaintCool: { value: new THREE.Color(o.cool ?? '#8fa6c8') },
    uPaintWarm: { value: new THREE.Color(o.warm ?? '#fff1d6') },
    uPaintRim: { value: new THREE.Color(o.rim ?? '#ffe9c4') },
    uPaintSky: { value: new THREE.Color(o.sky ?? '#bcd8ff') },
    uPaintBand: { value: o.band ?? 0.55 },
    // Scaled up because the rim is now measured *against the surface's own
    // colour*: a mid-grey albedo eats most of it, so the same numbers a caller
    // used before land at about the same brightness on a mid-tone and go quiet
    // on a dark one, which is the point.
    uPaintRimK: { value: (o.rimStrength ?? 0.22) * 2.6 },
    uPaintRimP: { value: o.rimPower ?? 2.6 },
    uPaintSkyK: { value: o.skyStrength ?? 0.07 },
  };

  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${HEAD}`)
      .replace('#include <opaque_fragment>', `${PATCH}\n#include <opaque_fragment>`);
  };
  // Two materials with different uniforms must not share a compiled program.
  m.customProgramCacheKey = () => `paint|${o.band ?? 0.55}|${o.rimStrength ?? 0.16}|${o.rimPower ?? 2.6}`;

  return m;
}

// ------------------------------------------------------------------ palettes

/**
 * A palette is the whole identity of a scene, so it is one object rather than
 * colours scattered through the scene files.
 */
export interface Palette {
  name: string;
  /** Behind everything, and what distance fades to. */
  sky: string;
  haze: string;
  /** How quickly distance turns to haze. */
  hazeDensity: number;
  ground: string;
  rock: string;
  rockDark: string;
  grass: string;
  water: string;
  timber: string;
  stone: string;
  cloth: string;
  metal: string;
  /** Faces and hands. Never the accent — that is the colour of the lamps. */
  skin: string;
  accent: string;
  /** Key light. */
  sun: string;
  sunStrength: number;
  /** The cool side of every painted surface in this scene. */
  cool: string;
  warm: string;
  rim: string;
  /** Bounce from the sky and from the ground. */
  skyBounce: string;
  groundBounce: string;
  /**
   * Flat light in the whole scene, on top of the key and the bounce.
   *
   * Only really for the night sets. A room lit by one candle is not black —
   * the eye opens, and everything in it comes up out of the dark far enough to
   * have a shape. Rendered without this, an interior at night is a correct
   * simulation of a photograph nobody would print.
   */
  ambient: number;
  /** Tone-mapping exposure. Night sets are shot open. */
  exposure: number;
}

export const PALETTES: Record<string, Palette> = {
  /** Petersburg in the small hours: yellow lamps in a blue city. */
  petersburg: {
    name: 'Petersburg, past midnight',
    sky: '#182444', haze: '#22305a', hazeDensity: 0.022,
    ground: '#3d3f5a', rock: '#4e4e6b', rockDark: '#343450',
    grass: '#3c5a55', water: '#22375a', timber: '#61503f',
    stone: '#5f5e77', cloth: '#8f5a62', metal: '#818499', skin: '#c99b7e', accent: '#f5c264',
    sun: '#ffd9a0', sunStrength: 3.4,
    cool: '#6d88c4', warm: '#ffe6bd', rim: '#9fc6ff',
    skyBounce: '#4a72a8', groundBounce: '#39304a',
    ambient: 0.5, exposure: 1.4,
  },
  /** A corridor of offices that goes on for ever. */
  chancery: {
    name: 'The chancery',
    sky: '#cec2a6', haze: '#bcae91', hazeDensity: 0.014,
    ground: '#7b7057', rock: '#9a8f74', rockDark: '#635a45',
    grass: '#7e8863', water: '#6f7a72', timber: '#6d5233',
    stone: '#b7aa8c', cloth: '#4f4636', metal: '#8a8371', skin: '#c9a583', accent: '#d8b23f',
    sun: '#fff0c8', sunStrength: 2.0,
    cool: '#87879c', warm: '#fff3cf', rim: '#ffeab0',
    skyBounce: '#d6cbaa', groundBounce: '#6b6146',
    ambient: 0.12, exposure: 1.0,
  },
  /** A house with damp in the walls. */
  usher: {
    name: 'The old house',
    sky: '#3b2f27', haze: '#4a3a30', hazeDensity: 0.016,
    ground: '#4d3d32', rock: '#5e4c3e', rockDark: '#3a2e26',
    grass: '#4a533f', water: '#333c39', timber: '#6b4a35',
    stone: '#6b5a4c', cloth: '#8f4038', metal: '#8a7f73', skin: '#c08c6e', accent: '#e0662f',
    sun: '#ffbe7a', sunStrength: 3.6,
    cool: '#7d76a0', warm: '#ffd9a6', rim: '#ff9c6a',
    skyBounce: '#565073', groundBounce: '#48342a',
    ambient: 0.62, exposure: 1.45,
  },
  /** Paper, sun and salt. */
  paper: {
    name: 'The paper coast',
    sky: '#bfe4ee', haze: '#d8ecef', hazeDensity: 0.016,
    ground: '#c9b593', rock: '#cfae9a', rockDark: '#a4816f',
    grass: '#6fa53f', water: '#48b7c4', timber: '#a97b4e',
    stone: '#d6c3ad', cloth: '#e8734a', metal: '#9fb0b8', skin: '#d8a077', accent: '#ffd23f',
    sun: '#fff4d2', sunStrength: 2.4,
    cool: '#8fb3d8', warm: '#fff2d4', rim: '#ffeec2',
    skyBounce: '#cfe9f5', groundBounce: '#b39a76',
    ambient: 0.1, exposure: 1.0,
  },
  /** The library the reader is sitting in. */
  reading: {
    name: 'The reading room',
    sky: '#241f30', haze: '#2e2740', hazeDensity: 0.016,
    ground: '#43364c', rock: '#50435c', rockDark: '#332941',
    grass: '#4a5c4c', water: '#35426a', timber: '#6f4c38',
    stone: '#5f5468', cloth: '#9a5442', metal: '#8f849a', skin: '#c99b7e', accent: '#f0b455',
    sun: '#ffd79a', sunStrength: 3.2,
    cool: '#7684bc', warm: '#ffe8c0', rim: '#ffcf94',
    skyBounce: '#585680', groundBounce: '#3d3044',
    ambient: 0.5, exposure: 1.4,
  },
};

/** Every painted material in a scene shares the palette's light. */
export function painter(p: Palette) {
  return (colour: THREE.ColorRepresentation, extra: Partial<PaintOptions> = {}) =>
    paint({
      colour,
      cool: p.cool,
      warm: p.warm,
      rim: p.rim,
      sky: p.skyBounce,
      ...extra,
    });
}
