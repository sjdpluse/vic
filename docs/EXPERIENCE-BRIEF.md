# Experience Brief

## North star

The website should feel like a premium architectural experience before it feels like a conventional construction website.

The visitor should enter a calm, high-confidence environment: large editorial typography, restrained navigation, generous whitespace, beautiful project media and one memorable interactive centrepiece.

## Signature scroll story — house transformation

The principal 3D scene is a residential house shown in a controlled architectural camera composition.

### Initial state

The house communicates an existing property in need of renewal. The treatment should be realistic and tasteful rather than ruined or theatrical.

Potential visual states, depending on the final model and approved art direction:

- weathered roof / roof tiles
- faded exterior finish
- aged gutters/fascia
- worn render/paint
- selected incomplete/older details
- cooler, flatter lighting

### Transformation

Scroll progress drives a staged renovation/restoration sequence rather than an autoplay animation.

Proposed timeline:

1. **Existing condition** — initial old/aged state.
2. **Assessment / structure** — camera reveals building form and key areas.
3. **Roof restoration** — roof materials transition to renewed finish.
4. **Guttering / exterior** — gutter/fascia elements transition.
5. **Rendering / painting** — facade surface changes cleanly.
6. **Detail / carpentry / tiling cues** — use carefully if visually appropriate; do not force every service into the model.
7. **Completed result** — polished modern house, warmer light, refined landscape/ambient treatment.

Text and service labels should enter at intentional beats, not constantly float around the model.

## Interaction model

Desktop:
- pinned or semi-pinned scene for a bounded section
- scroll maps to deterministic animation progress
- subtle pointer parallax only if it does not fight scroll direction
- service labels and editorial text transition in/out around the scene

Mobile:
- shorter scroll timeline
- reduced geometry/texture profile
- simplified camera path
- fewer simultaneous overlays
- 2D/video fallback if device capability or loading conditions require it

Reduced motion:
- no scrubbed continuous motion
- show a stable completed/representative house state
- expose the same service/content narrative in normal document flow

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
- wireframe or blueprint overlays
- subtle construction-grid cues
- transparent structural linework
- depth and layered 3D composition
- no fake dashboard statistics on the public marketing site

The technical language should support the architectural story, not turn the website into a project-management dashboard.

## Homepage narrative

### 1. Entry / hero
A minimal premium header and a strong opening statement.

Possible message direction:
**Build. Renovate. Restore.**

The 3D house establishes the main visual immediately or within the first controlled scroll beat.

Primary conversion action: request consultation / free quote.

### 2. Transformation story
The aged-to-renewed house sequence explains the business proposition through motion.

### 3. Services
Services appear as an architectural spatial system, not a basic icon grid. Interactions may highlight corresponding material/house zones where technically sensible.

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

Targets will be refined after model selection.

- non-3D content should become useful quickly even while the 3D bundle/model loads
- avoid loading full-quality 3D on devices that cannot sustain it
- keep one primary WebGL canvas rather than many simultaneous canvases
- aggressive GLB/texture optimisation
- lazy-load later project galleries
- preserve Core Web Vitals as a product requirement, not an afterthought

## Failure modes to avoid

- generic landing-page blocks stacked vertically with minimal art direction
- an oversized 3D asset that causes a blank loading screen
- smooth scrolling that feels delayed or fights the user's input
- mobile experience that simply scales down the desktop scene
- animation on every element with no hierarchy
- contact/form actions hidden behind visual effects
- fake numbers/trust badges/dashboard widgets
- unverified construction/legal claims
