# Experience Brief

## North star

The website should feel like a premium architectural experience before it feels like a conventional construction website.

The visitor should enter a calm, high-confidence environment: large editorial typography, restrained navigation, generous whitespace, beautiful project media and one memorable interactive centrepiece.

## Signature scroll story — cinematic house transformation

The principal visual is a residential house shown in a controlled architectural camera composition.

The source is a purpose-built cinematic transformation sequence, not an ordinary promotional video. It must be authored around the website scroll storyboard from the beginning so renovation beats, camera holds and service-label timings line up with the interaction.

### Initial state

The house communicates an existing property in need of renewal. The treatment should be realistic and tasteful rather than ruined or theatrical.

Potential visual states, depending on final art direction:

- weathered roof / roof tiles
- faded exterior finish
- aged gutters/fascia
- worn render/paint
- selected incomplete/older details
- cooler, flatter lighting

### Transformation

Scroll progress deterministically selects frames from an optimized image sequence. The transformation is reversible: scrolling upward returns the house toward its earlier state.

Proposed beats:

1. **Existing condition** — initial aged state.
2. **Assessment / pause** — controlled composition establishes the building.
3. **Roof restoration** — roof visibly renews.
4. **Guttering / fascia** — exterior edge details renew.
5. **Rendering / facade** — worn surface transitions to clean finish.
6. **Painting / finishing** — colour, trim and final surface treatment complete.
7. **Completed result** — polished modern house, warmer light and refined atmosphere.

Text and service labels should enter at intentional beats, not constantly float around the house.

## Interaction model

Desktop:
- pinned or semi-pinned Canvas for a bounded section
- scroll maps deterministically to a frame index
- HTML headings/service labels/CTAs are layered above or beside the Canvas
- optional subtle parallax only if it does not fight scroll
- progressive preloading keeps the current/nearby frames ready

Mobile:
- dedicated mobile composition or crop authored intentionally
- shorter scroll timeline
- lower frame count and/or smaller dimensions
- fewer simultaneous overlays
- stable poster fallback on constrained devices or failed preload

Reduced motion:
- no continuous scrubbed sequence
- show a stable representative frame, preferably the completed/hero state
- expose the same service/content narrative in normal document flow

## Frame-production requirements

The cinematic source must preserve the exact architectural identity of the house across the whole sequence.

Unacceptable artefacts:
- windows changing count or location
- roof geometry morphing
- doors/columns appearing/disappearing unexpectedly
- camera cuts that break spatial continuity
- obvious AI shimmer/flicker
- landscape or façade details changing randomly

If AI video is used, prefer controlled start/end-frame generation or staged clips with continuity review rather than unconstrained text-to-video.

Suggested production strategy:
- create approved OLD keyframe
- create approved RENEWED keyframe of the exact same house
- generate/animate controlled transition beats
- edit into a continuous master
- export high-quality master video
- derive optimized AVIF/WebP frame sequences
- create a separately composed mobile sequence when needed

## Frame delivery strategy

The production website should not place hundreds of image nodes in the DOM.

Use an HTML Canvas renderer driven by scroll progress.

Conceptual mapping:

- scroll 0% → first frame
- scroll 25% → roof beat
- scroll 50% → gutter/facade beat
- scroll 75% → finishing beat
- scroll 100% → completed frame

Frames are loaded progressively:
1. poster/current frame
2. near-future and near-past frames
3. remaining chunks in the background

Large production frame sets belong in external object storage/CDN, not GitHub.

## Visual language

References supplied by the client point toward two complementary directions:

### Architectural editorial
- white/cream canvas
- large serif or refined display typography paired with modern sans
- dark charcoal/navy or near-black surfaces
- restrained deep brand red
- rounded architectural media frames used selectively
- layouts that feel more like architecture/editorial design than SaaS cards

### Technical / spatial layer
- subtle blueprint overlays
- construction-grid cues
- transparent linework
- spatial depth and layered composition
- no fake dashboard statistics on the public marketing site

The technical language should support the architectural story, not turn the website into a project-management dashboard.

## Homepage narrative

### 1. Entry / hero
A minimal premium header and a strong opening statement.

Possible message direction:
**Build. Renovate. Restore.**

The house establishes the main visual immediately or within the first controlled scroll beat.

Primary conversion action: request consultation / free quote.

### 2. Transformation story
The aged-to-renewed frame sequence explains the business proposition through motion.

### 3. Services
Services appear as an architectural spatial system, synchronized with relevant transformation beats where sensible, not as a basic icon grid.

### 4. Selected projects
Real project media from CMS/Storage. Strong full-bleed / asymmetric presentation, with only verified project metadata.

### 5. Process / consultation
Explain the path from enquiry to assessment/quote/work in conservative wording until operational details are confirmed.

### 6. Final conversion
A premium consultation module with icon-based contact actions and a dedicated form entry point.

## Contact presentation

Do not repeatedly display raw phone/email in prominent marketing UI.

Use clear icon + label actions such as:
- Call us
- Email us
- Request a consultation

Raw contact data may still be present where legally/usability appropriate (for example accessible labels, footer/contact page, structured data) but the visual language should remain deliberate.

## Enquiry experience

The consultation flow should feel like part of the premium product, not a generic form.

Suggested multi-step structure:
1. Project type/service
2. Location/suburb/postcode
3. Short project description
4. Preferred timeframe
5. Upload project photos/plans
6. Contact details
7. Review and submit

Requirements:
- autosave only if privacy/security design supports it
- validation with helpful errors
- upload previews
- progress indicator
- no unnecessary fields
- clear consent/privacy treatment
- success confirmation
- email notification to business

## Admin experience

Admin UI can be clean and operational rather than cinematic. Prioritise speed and clarity.

Core areas:
- Projects
- Project media
- Homepage featured selection
- Site settings
- Consultation/enquiries (optional in first admin release; email delivery remains required)

## Performance budgets — initial targets

Targets will be refined after the real sequence exists.

- non-sequence content should become useful quickly while frame assets preload
- no blank hero waiting for hundreds of frames
- desktop/mobile sequences should have separate delivery budgets
- use compressed AVIF/WebP frames
- progressively preload rather than eager-load the full sequence
- use a stable poster if sequence assets fail
- lazy-load later project galleries
- preserve Core Web Vitals as a product requirement, not an afterthought

## Failure modes to avoid

- generic landing-page blocks stacked vertically with minimal art direction
- treating a normal video as a scroll sequence without redesigning its timing
- loading every frame before showing useful content
- smooth scrolling that feels delayed or fights the user's input
- mobile experience that simply crops the desktop master badly
- animation on every element with no hierarchy
- contact/form actions hidden behind visual effects
- fake numbers/trust badges/dashboard widgets
- unverified construction/legal claims
