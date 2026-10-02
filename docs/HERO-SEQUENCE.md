# Hero Sequence — Moving Cinematic House

## Core decision

The homepage hero must **not** behave like a pinned full-screen scene where the page appears frozen while the visitor scrubs an animation in place.

The page continues to move naturally in normal document flow.

The house begins below the primary headline / slogan, low in the composition and partly emerging from the lower portion of the hero. As the visitor scrolls:

1. the entire hero continues travelling upward with the document;
2. the house rises upward through the composition;
3. the house transformation advances from aged / worn to renewed;
4. the completed house reaches its strongest visual position shortly before the hero exits;
5. the next homepage section enters naturally from below without a hard stop or separate animation stage.

This is the signature homepage transition.

## Visual composition

Reference direction:

- restrained premium header at the top;
- large centered or editorial headline in the upper hero;
- short supporting line and primary consultation CTA;
- house positioned below the copy rather than replacing the copy;
- generous negative space;
- architectural background treatment rather than a busy environment;
- visual hierarchy similar to premium architecture/property editorial sites, not a construction template.

The initial viewport should already contain enough of the house to create curiosity, but the house may be partially cropped by the bottom edge.

## Scroll choreography

The hero remains in normal flow. Do not use a long `pin: true` / frozen viewport interaction.

Conceptual progress:

### 0–15% — Arrival
- headline, supporting copy and CTA are fully legible;
- house is in its lowest position and predominantly aged / existing-condition;
- motion is minimal so the first impression can be read immediately.

### 15–55% — Rise + renovation
- house moves upward through the hero composition;
- sequence advances through roof, gutter/fascia and facade renewal beats;
- headline may move/fade subtly with the page, but must not fight the house;
- scroll remains native-feeling and continuously advances the document.

### 55–80% — Completion
- finishing/painting state resolves;
- lighting and finish reach the completed renewed state;
- house occupies its strongest/largest composition;
- optional small service cues may appear, but the hero should remain visually disciplined.

### 80–100% — Handoff
- completed house and hero content continue upward with the page;
- the next editorial section enters from below;
- avoid a blank gap, hard cut or second pinned stage;
- the transition should feel like one continuous landing-page journey.

## Frame-sequence production

The master sequence should be authored to support this composition from the beginning.

Preferred approach:

- OLD keyframe and RENEWED keyframe use the exact same house and camera identity;
- the source animation includes the controlled upward composition of the house while renovation progresses;
- no camera cuts;
- no random perspective shifts;
- no geometry drift;
- no window/door/roof shape changes unrelated to the renovation;
- desktop and mobile masters may use different compositions while preserving the same narrative timing.

Suggested transformation beats:

1. existing / aged house;
2. roof restoration;
3. gutter / fascia renewal;
4. facade / render restoration;
5. paint / finishing;
6. completed premium state.

The sequence is then converted into optimized AVIF/WebP frames and scrubbed by scroll progress.

## Rendering model

- Canvas is used for the image sequence.
- HTML remains responsible for headline, body copy, navigation and CTAs.
- ScrollTrigger maps the hero's scroll progress to the active frame and any synchronized text transitions.
- The hero itself remains in normal layout flow; the experience must not rely on pinning the entire viewport.
- Reverse scrolling must deterministically reverse the sequence.

## Desktop

Initial design target:

- hero height approximately 130–170vh, refined through prototype testing;
- headline in upper area;
- house starts low / partially cropped;
- house rises and resolves before the hero leaves the viewport;
- next section begins entering before the completed house fully disappears.

These values are hypotheses until prototype measurement.

## Mobile

Do not simply crop the desktop result.

- create a dedicated portrait/mobile master or composition;
- keep the headline readable without the house covering it;
- house begins lower and may occupy more width;
- shorten the scroll range;
- reduce frame dimensions/count when required;
- avoid excessive text overlays during the transformation;
- preserve the same rise + renewal + handoff story.

## Reduced motion

For `prefers-reduced-motion`:

- no continuous frame scrubbing;
- show a stable representative/completed image;
- allow the hero to scroll normally into the following section;
- preserve all semantic copy and CTA access.

## Performance rule

The first meaningful hero view must not wait for the complete frame set.

Load order:

1. poster / first useful frame;
2. first nearby frames;
3. progressive chunks around current direction/progress;
4. remaining frames opportunistically.

If a frame is unavailable, render the nearest loaded frame rather than blank Canvas.

## What not to build

- no multi-screen pinned hero that freezes the page for several viewport heights;
- no autoplay video that ignores user scroll;
- no separate 3D/WebGL house unless a future requirement genuinely needs it;
- no generic service-card wall inside the hero;
- no motion that hides the consultation CTA or makes normal scrolling feel delayed.
