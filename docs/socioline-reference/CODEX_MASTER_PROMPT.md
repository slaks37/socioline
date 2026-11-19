# CODEX MASTER IMPLEMENTATION PROMPT — SOCIOLINE METAVERSE CITY (V2)

## Your role and mandate
You are the principal full-stack engineer, 3D game engineer, creative technical director, UX/accessibility lead, technical SEO engineer, and QA lead for **SocioLine Digital World**. **Implement a runnable product in the repository, not only a strategy document, static mockup, or slideshow.** Start with a working vertical slice, then expand to a connected city as far as the repository, tools, available assets, and execution environment allow. Be candid about what is complete versus scaffolded or awaiting credentials.

Respond to me in **Bahasa Indonesia** when reporting progress, decisions, results, and blockers. Source code, types, tests, and comments may be in English. Public-facing default language is Bahasa Indonesia; preserve the brand/program terms **SocioLine**, **The Word**, **The World**, **The Work**, and **W3 Discovery-to-Impact Journey** in English.

I have approved the following product direction. Do not replace it with a normal multi-section landing page, cards representing districts, a video pretending to be a game, or three disconnected 3D scenes.


## METAVERSE EXPERIENCE CONTRACT — HIGHEST VISUAL & UX PRIORITY (V2)

### 1. Product identity: an inhabitable virtual place, not a website with 3D
Build **SocioLine Metaverse City**, an original, browser-based, persistent-feeling 3D place. The desired perception is **"I have entered SocioLine's digital world"**, not "I am viewing a website that has a 3D background". Users must be embodied by their avatars in a spatially coherent city, follow streets, see meaningful landmarks, approach buildings, enter selected spaces, interact with information and activities, and emerge back into the same urban environment. The experience should have the immersion and polish of a modern stylized life-simulation/game world, while retaining genuine public SEO pages behind the scenes.

**Terminology integrity:** use **metaverse-inspired / immersive virtual city** unless real-time shared social presence, persistent accounts/world state and other relevant capabilities have actually been implemented. Do NOT claim this is a multi-user metaverse or show simulated avatars as "other real visitors" if multiplayer is absent. No blockchain, crypto wallet, NFTs, token, Web3 purchase, or VR headset requirement is implied by the word "metaverse".

### 2. Required moment-to-moment player experience
Sequence from the user's perspective:

1. **Invitation / Arrival Portal:** a lightweight, fast-loading SocioLine homepage invites the user to `Enter the World`, while plain `Browse Website` remains prominent and crawlable. A cinematic teaser must not obstruct SSR content or auto-play heavy 3D.
2. **World Entry:** optional smooth portal/fade transition with atmospheric audio choice, progress/loading feedback, and a distinct sense of entering a different place. Do not use long mandatory intro videos; provide `Skip Intro`.
3. **Avatar Creator:** select Male or Female visual base; customize face/hair/skin/outfit with original humanlike character assets; preview 360° and select name if desired. Preset genders are customizable starting designs, not hard rules for cosmetics. Default art style is **stylized semi-realistic life simulation**, with anime-inspired option only when supported by actual models. Avoid blocky Roblox figures and voxel anatomy.
4. **First Spawn:** place avatar at an elevated **Welcome Terrace** looking across the **actual connected city**, then let the visitor descend through the SocioLine Central Plaza (the same world, not an image). Short, skippable cinematic camera reveal of WEST Word / CENTER World / EAST Work; keep player input promptly available.
5. **Explore:** physically traverse streets, sidewalks, pocket parks, crossroads, public squares, bridges and corridors with genuine 3D depth, collisions, third-person follow camera, idle/walk/run animations, directional cues and district landmarks. The city must appear alive even when visitor is alone.
6. **Approach Landmark:** a building has a visible name, entrance, nearby signage, and contextual `E / Tap` trigger. Its proximity prompt refers to an object actually present in the world.
7. **Enter / Interact:** **at least one flagship indoor experience in the first vertical slice**: open/transition into a modest modeled interior, walk a few meters to an exhibit/information stand, interact, and open a properly keyboard-accessible HTML panel tied to a real canonical content URL. A scene-loaded interior is acceptable; do not falsely claim every building has a seamless interior. Other buildings can start with functional external interaction and phased interiors.
8. **Explore Information Without Leaving the Experience:** an in-world sign/hologram/billboard is visually grounded in the environment; the long content is in HTML modal or full reading mode with preserved avatar/world state. After closing, return to the **same avatar and place**, not a reset screen.
9. **Make Progress:** a nonreligious `Places Visited` or `Journey Map` tracker helps orientation and remembers only the visitor's chosen progress/preferences where supported. No faith scores or conversion goals. Optional learning quests should be tied to content and community action, not compulsive engagement mechanics.
10. **Exit & Resume:** `Leave World` returns to standard website; `Resume Exploring` returns to a sensible location/last landmark where preferences allow. Never lock reading or services behind avatar creation.

### 3. City should feel inhabited — environmental storytelling, not empty boxes
Make recognizable **city blocks with human-scale details**: varied facade heights, doors and windows, sidewalks, streetlights, textured streets, landscaping, street furniture, city signage, signposts, billboards, transit stops, plazas, parklets, distinct day/night lighting presets, distant traffic/skyline atmosphere, and controlled ambient activity. Use coherent architecture for all districts while giving each a color/material/storytelling identity:
- **WEST / THE WORD**: reflective educational quarter with substantial Word Library, Scripture Gallery, Calling House, warm interiors, quiet gardens, navy/violet/gold accent.
- **CENTER / THE WORLD**: lively civic & cultural quarter with community center, research/digital globe, people-and-culture installations, teal/blue, bustling public plaza.
- **EAST / THE WORK**: productive innovation quarter with design labs, co-working/makerspace, prototype workshop, impact displays, lime/green accent.
- **CENTRAL / SOCIOLINE HUB**: active plaza, social meeting points, News Tower, Knowledge Library, collaboration venue, Avatar Studio, navigational landmarks.

NPCs may follow local scripted pedestrian routes and animations, use simple info dialogues, attend venues and make the environment feel active. **Visually separate NPCs from real connected users** and never claim presence of live users without backed real-time sessions. Optional ambient sounds (footsteps, traffic breeze, district ambience, crowd murmur) must default to muted or user-enabled, include accessibility controls, and avoid misleading "live conversations".

Prefer polished and moderately dense compact explorable city over giant sparse terrain; show more than one block per district with physically coherent connected streets as scope permits. Distant skyline can be LOD/decorative while landmark zones are accessible. Do not use skybox-only 3D that feels like a flat panorama.

### 4. Character quality & game feel
Create original medium-poly / stylized PBR characters with human proportions, distinct male/female base presets and compatible humanoid rig. Prioritize **animation quality**, not photo realism:
- Blend movement idle/walk/run smoothly and rotate naturally; grounded foot placement and gravity, no T-pose or skating if avoidable.
- Follow/orbit camera with smooth easing, sensible FOV and collision/occlusion handling; navigation should feel good on desktop and touch.
- Interactions feature contextual gestures or head-turn, subtle VFX/sound feedback and no jarring UI flashes.
- Support low/medium/high graphics modes, reduced motion, mute, camera sensitivity, key controls help, joystick/touch controls, fall recovery.
- Avatar customization is purely cosmetic and accessible; a previous avatar is optional, guest is the default. Any real multiplayer state or accounts are later milestones.

### 5. Game-native UI, not a web dashboard on top of a city
The UI should feel like a polished game HUD, intentionally restrained:
- Small minimap and compass, district discovery indicators, contextual key hints, map/quest journal, pause/settings, fast travel points, optional compact destination markers.
- Keep giant navigation bars, full-screen menus and repeated SEO text **off the active 3D gameplay viewport**. Provide accessible HTML menu when invoked; those same public pages are still independently reachable via site navigation.
- District discovery should be communicated spatially: gate, road banner, signage, pavement language, environment transitions; not merely a click on colored district cards.
- Offer camera/photo mode later only if genuine; avoid decorative no-op controls.

### 6. Web content & SEO remain real, first-class products
**Every informational object in the city maps to a real, canonical, server-readable HTML route** via a typed landmark/content registry. Billboard text can be rendered as textures for atmosphere but must also be available as HTML text elsewhere. Blog/News are indexed public articles; 3D News Tower is an alternate way to find them. Direct Google search arrival must never be redirected to avatar selection. A user who lands on `/the-word`, `/news/[slug]` or `/programs/w3-journey` should read content without waiting for game assets.

Embed continuity both ways:
- **Game → Content:** interact with billboard/building → readable accessible overlay → canonical article/program link.
- **Content → Game:** `Visit this place in SocioLine World` optionally deep-links to `/explore?landmark=<known-id>`; avatar/camera starts or fast-travels near mapped landmark after consent, with static map alternative.
- **Resume:** after article closes, restore the player's previous world position/state when technically possible.

Never create duplicate indexable content in different routes merely because it is attached to different landmarks. Set canonical metadata correctly. Respect users who choose no WebGL or reduced motion.

### 7. Practical priority, realism and scope
Deliver a **convincing playable metaverse-like VERTICAL SLICE FIRST**, not a huge empty map. Do not attempt full multiplayer or persistent global state in M1.

The **first release candidate (M1)** requires: an actual avatar selection screen, original believable stylized human character (or clearly labeled temporary model if original asset creation is blocked), cinematic-to-playable spawn terrace/plaza, at least two visually distinct connected blocks, walk/run, follow camera, a living ambience from nonplayer NPC paths or equivalent, a meaningful enterable flagship building/interior (small is fine), at least two working interactions, return-to-same-location behavior, pause/help/settings, and real SEO page readback with JavaScript/WebGL disabled.

The **connected-world milestone (M2)** requires: 3 districts physically connected, more than one explorable block where practical, landmark signage, roads/crossings/vegetation, HUD/minimap/fast travel, distinctive environment storytelling, 3D billboard integration, mobile controls/fallback, and deep-links. Do not mark M2 PASS merely because three color-coded cube buildings exist.

**Multiplayer (M5 optional)**: only after fundamental 3D performance, content/SEO, privacy/safety and operating model are working. If pursued later, design dedicated server-authoritative rooms/shards, opt-in presence, privacy controls, chat moderation/report/block, abuse prevention, and guest-to-account migration. Do not include public chat by default, especially for minors.

**Acceptance demonstration must prove immersion** (video/screenshots and interactive browser verification when possible):
- From spawn, camera turns and reveals multiple connected city blocks and the distant skyline.
- Avatar traverses a real street to a district, does not float through buildings, and can return.
- User approaches a building's visible entrance and is prompted to interact.
- User enters an actual 3D interior at least in the vertical slice, reads an exhibit's accessible HTML and returns to the same place.
- One billboard or information kiosk opens real editorial/brand content linked to a public URL.
- User exits or reloads and can return to 2D browsing, with no loss of public access.
- With JavaScript/WebGL disabled, HTML brand/program/article pages retain core content and crawlable links.

If these are not implemented, report **METAVERSE IMMERSION = PARTIAL**, not PASS, regardless of how attractive the homepage screenshot looks.

### 8. Production review / 3D performance
Define quality presets and measure actual render performance on representative hardware rather than asserting cinematic quality. Prioritize texture budgets, instancing/LOD, frustum culling, district chunking, dynamic resolution, GPU memory cleanup, progressive asset loading, and data-driven animation. Desktop target 60 FPS and mobile 30 FPS are **aspirational targets subject to device testing**, not guaranteed results. Put initial brand/HTML content in SSR so 3D does not worsen content LCP unnecessarily. Maintain privacy-conscious telemetry and no ambient audio autoplay.

### Explicit anti-patterns to reject
- Conventional hero + three cards + a decorative animated city background.
- Static/video rendering pretending to be playable city.
- Teleport-only navigation between disconnected scenes.
- A miniature diorama with no human-scale walkable streets.
- Polygon cubes presented as finished male/female avatars.
- Hundreds of unenterable decorative buildings with no meaningful content interactions.
- Fullscreen HTML blocks permanently covering game viewport.
- Required signup, wallet, cryptocurrency, NFT or paid account before exploration.
- Fabricated online users, fake events, fake news or invented impact claims.
- Game-only information with no canonical crawlable HTML routes.

**Resolution of priorities:** If there is tension between high visual fidelity and meeting the first milestone, deliver a smaller but genuinely immersive, navigable and polished world; disclose which elements are placeholder art, which are actual playable systems, and which need production assets. Do not sacrifice SEO, accessibility or safety to add visual effects.

---

## 0. Inputs, source of truth, and working rules
1. Inspect the current repository and its README, existing code, package manager, assets, environment examples, git status, and deployment setup **before** changing anything. Respect existing architecture and do not delete unrelated work. If there is no app, bootstrap a maintainable Next.js/TypeScript project.
2. If present in the workspace, read these references before coding (names may differ):
   - `SocioLine_3D_City_Masterplan_v2.md`
   - `SocioLine_City_Zoning_Map_v2.png` or `.svg`
   - `SocioLine_Master_Blueprint_Visi_Misi_dan_Program_Operasional.docx`
   - previous SocioLine sitemap/wireframe handoff and the SocioLine logo asset.
   If files are missing, **do not block**; use the complete specification below, log what is missing, and never invent facts about activities not yet established.
3. Do not invent domains, API keys, project IDs, partner names, publications, launch dates, impact statistics, official contact addresses, or actual open cohorts. Use configuration, clearly marked design samples in non-indexed demo content, and honest states such as “Pendaftaran belum dibuka”.
4. Use original assets or legally usable assets with recorded licenses. Do not copy Roblox, The Sims, anime franchises, or other copyrighted characters. Visual references describe aesthetic quality, not assets to duplicate.
5. Do **not** deploy publicly, create paid resources, purchase assets, or connect production accounts unless authorized. Build locally, document deployment readiness, and run the verification steps available.
6. If a decision is reversible, choose a sensible default and document it instead of stopping to ask. If resources are constrained, deliver a polished **playable vertical slice + real crawlable content routes** before attempting a broad but broken city.

## 1. Product identity and theology/program context
**Brand:** SocioLine, a faith-rooted collaborative impact and sociopreneurship ecosystem connecting individuals, churches, communities, professionals, organizations, industry partners, resources, and opportunities. It is **not only an online course provider**.

**Brand positioning:** “From Calling to Collaborative Impact.”
**Guiding statement:** “The Word gives direction · The World gives context · The Work creates impact.”
**Values:** Faithful · Contextual · Strategic · Sustainable.
**Mission approach:** Ground decisions in Scripture and ethical discernment, listen to real communities, then co-design and validate responsible solutions. Business Model Canvas, Value Proposition Canvas, prototyping, experimentation, partnerships, and impact measurement are tools of stewardship, not substitutes for faith, human dignity, or community agency.

**Three interrelated programs/districts:**
- **The Word:** biblical foundations, mission, calling, identity, discernment, commitment. Journey steps: Encounter → Understand → Discern → Commit. Typical outputs: Calling Map and Mission Charter.
- **The World:** people, culture, community, needs/assets, empathy, research, context, opportunities. Journey steps: Explore → Encounter → Listen → Understand → Discover Opportunities. Typical outputs: Community Profile, Stakeholder Map, Opportunity Brief.
- **The Work:** convert calling and community understanding into action through collaboration, Value Proposition Canvas, Mission Model Canvas, pilots, delivery, and learning. Journey steps: Choose Role → Co-Design → Model → Experiment → Serve → Multiply. Outputs: mission/venture design, experiment evidence, Mission Portfolio, Impact & Learning Review.

One proposed flagship is **W3 Discovery-to-Impact Journey**, a **draft 12-week cohort**. Its precise weekly distribution and enrollment status must remain configurable, not claimed to be officially launched. All three Word/World/Work lenses apply throughout the entire process even when one phase is emphasized.

Faith-related materials must be transparently labeled. Access to public information, community support, and collaboration must never depend on spiritual participation or religious conversion. No gamified piety score or conversion leaderboard. Community stories and project impact claims require authorization and evidence before publication.

## 2. Non-negotiable experience: a single, real 3D open world (implement the Metaverse Experience Contract above)
Imagine a high-quality stylized 3D browser game with an inhabited city: long avenues, blocks, sidewalks, parks, trees, street furniture, buildings of different sizes, lighting, landmarks, a city skyline, NPC pedestrians, and navigable exterior spaces. Users should perceive a **cohesive playable city**, not a website hero graphic.

City layout, from the visitor's overview:
- **WEST / LEFT: THE WORD DISTRICT** — navy/indigo/violet, warm library lights, reflective gardens, scripture gallery, educational buildings.
- **CENTER / MID-BACK: THE WORLD DISTRICT** — teal/blue, civic square, multicultural community buildings, research center, culture market, information screens.
- **EAST / RIGHT: THE WORK DISTRICT** — lime/green/turquoise, innovation labs, makerspace, sustainable modern workspaces, experimentation and impact buildings.
- **FRONT-CENTER: SOCIOLINE CENTRAL HUB** — spawn plaza, circular landmark/fountain with SocioLine identity, city information, Avatar Studio, News Tower, Knowledge Library, Collaboration Center.
- **PHYSICAL CONTINUITY:** walkable boulevards, pedestrian routes, crossings, district markers and visible connections. Players must be able to walk from any district to another without requiring a menu/teleport. Minimap and fast travel are convenience features, not substitutes for the connected city.

**Art direction:** aspirational colorful urban city with polished environment art and animation; stylized semi-realism comparable to a modern life-simulation game, with optional anime stylization. Not cuboid/blocky Roblox avatars and not Minecraft/voxel city. Use calibrated day-light, atmospheric depth, soft shadows, high-quality material treatments, purposeful accent neon signs, greenery, and depth of scale. Keep the interface legible and the experience pleasant, not a distracting cyberpunk overload. Primary brand colors: navy, teal/turquoise, and lime; sample actual logo colors from the provided brand file if available rather than assuming hexadecimal values. Do not automatically use the magenta background of a reference logo as the entire website color.

### Renderable implementation
Use actual WebGL with React Three Fiber/Three.js. For the first working slice, procedurally model streets/buildings/terrain in code if professionally modeled GLB assets are unavailable; build proper scene hierarchy, lighting, shadows, collision, props, pedestrians/stand-ins, and strong district identity. Do not use static screenshots as a fake interactive background. Favor a manageable dense, convincing town over an empty giant map. Build model import adapters so approved original GLB assets can later replace procedural meshes without rewriting gameplay. Minimize meshes and draw calls via instancing, reused materials, and chunking.

## 3. User entry and avatar character creator
Public pages must be accessible without avatar or login. Entering `/explore` can start an **avatar gate**:
- Create/Choose avatar: **Male** or **Female** preset, both original stylized semi-realistic humans (human proportions, not block shapes); appearance options such as hair, skin tone, outfit. Anime 3D style is selectable if technically feasible with the available rig/assets. Roblox-like skin is **not a launch requirement** and may be deferred.
- Guest access, optional nickname; **no forced login**.
- Clear choices: `Use Previous Avatar` (if saved), `Customize Avatar`, `Explore without Avatar` (browse 2D/map mode), and `Enter City`.
- Let visitors rotate and preview their avatar. Use compatible humanoid rig and animations; if real rigged models are unavailable, build an honest original stylized procedural avatar MVP and label high-fidelity rigged character assets as an upgrade, never pass off unanimated primitives as finished anime models.
- Avoid storing demographic claims; Male/Female is a **visual preset choice** and cosmetics are not restricted to one preset. Persist optional avatar preferences only with user control/consent (e.g., local device), avoid storing unnecessary PII.
- On returning visits, provide a way to customize/replace character; do not trap users in repetitive setup.
- Animations: idle, walk, run, turn, jump/land if physically supported, inspect/interact, reading, simple talk/listen.

Third-person movement:
- Desktop: WASD to move, mouse drag/pointer lock with explicit permission to look, Shift to run, Space to jump if implemented, E to interact, Escape to pause/unlock.
- Mobile: touch joystick for movement, drag to orbit camera, large Interaction button, accessible minimap and performance settings.
- Smooth follow/orbit camera with collision/occlusion handling and adjustable sensitivity; don't allow the camera to clip through buildings.
- Character collision with ground/major buildings, no walking through walls or floating/falling out of the map. Provide spawn reset if avatar gets stuck.
- Avoid autoplay audio. Include reduced motion, mute and Low/Medium/High graphics controls.

## 4. The city must have interactive landmarks tied to real routes
Create a strongly typed `districts` and `landmarks` registry with unique ID, district, display name, position/rotation, trigger radius, interaction type, route, label, and associated CMS content reference. Store canonical URLs **outside** scene code so web and WebGL use the same route definitions.

Required MVP/main landmarks:

**Central Hub**
- SocioLine Plaza → `/` or `/about`
- Mission Compass → `/programs/w3-journey`
- Avatar Studio → avatar customization UI on `/explore`
- News Tower → `/news` and `/news/[slug]`
- Knowledge Library → `/resources`
- Collaboration Center → `/collaborate/partner`, `/contact`

**The Word District**
- Word Library → `/the-word`, `/the-word/program`
- Scripture Gallery → `/the-word/encounter`
- Calling House → `/the-word/discern`
- Commitment Room → `/the-word/commit`
- optional Reflection Garden → reflective non-intrusive info panel

**The World District**
- World Civic Hall → `/the-world`
- Culture Gallery → `/the-world/explore`
- Community Research Center → `/the-world/research`
- Opportunity Board → `/the-world/opportunities`
- optional Community Lab → `/the-world/listen`

**The Work District**
- Innovation Studio → `/the-work`
- Design / Value Proposition Lab → `/the-work/co-design`
- Mission Model Building → `/the-work/mission-model`
- Experiment Workshop → `/the-work/experiment`
- Impact Observatory → `/impact`, `/impact/projects`
- optional Venture/BAM Studio → only publish detailed venture offerings when ready

Minimum interaction: approach landmark → subtle glowing marker/ground decal → tooltip with building name and `Press E / Tap to Interact` → semantically accessible **HTML overlay/modal** (title, factual summary, relevant link, actions: Read More / Enter / Close) → full HTML page if requested. Implement keyboard focus management, Escape close, pointer controls recovery, click/tap interaction, and a route/deep-link to arrive at the corresponding landmark from an external page. Build the navigation/link registry so there are no dead buttons.

Interior strategy: don't attempt seamless interiors for every decorative building. Provide a high-quality initial interior or dedicated interactive space for **one flagship building**, then add others behind doors with streamed scene transitions. Each interior must have its own meaningful function; SEO pages stay independently accessible regardless of interior completion.

## 5. City HUD and world navigation
Desktop HUD:
- SocioLine logo and top navigation: Home, Explore, Programs, Impact, Stories & News, Resources, Collaborate.
- Top-left minimap with player position and district labels; easy expand/close.
- Top-right `Your Journey` tracker showing district exploration, **not** religiosity or faith achievement.
- Bottom quick travel/actions: Hub, The Word, The World, The Work, Map, Resources, My Journey.
- Contextual near-object interaction prompt; pause/settings; optional accessibility help.
- Avoid covering central gameplay with large persistent panels; modals and reading views are explicit choices.

Mobile HUD:
- Responsive touch joystick/camera, compact minimap, large interact action, collapsible nav, fast travel, simplified shadows and limited particles.
- If WebGL fails or device performance is poor, offer **Explore in 2D / Standard Website** immediately; never block public content behind device compatibility.

Player journey from first visit: HTML homepage → Enter Digital World → Avatar Creator or Skip → spawn in Central Plaza → optional short controls tutorial → physically explore districts → approach interactive building → read accessible HTML content → discover program/resources/news/impact → optional register interest/collaborate. Also support reverse journey: Google result → directly open an article/page without 3D → `Visit this location in 3D` deep-links to a landmark.

## 6. Full SEO-first sitemap to implement
Create working semantic public pages with meaningful content, links, headings, breadcrumbs and metadata. Do not create empty SEO doorways. A route without substantive content should be omitted from the public sitemap and held in a draft state until ready.

**Core brand**
- `/` — public indexable homepage with concise SocioLine positioning, the three W3 districts/programs, values, W3 journey, credible content previews, and primary CTAs; 3D should start only by deliberate user action or be loaded without blocking initial content.
- `/explore` — 3D city entry, intro and crawlable HTML fallback
- `/about`, `/about/vision-mission`, `/about/values`, `/about/framework`
- `/contact`, `/collaborate/partner`, `/collaborate/join`

**Programs**
- `/programs`, `/programs/w3-journey`, `/programs/w3-journey/curriculum`, `/programs/w3-journey/outcomes`, `/programs/w3-journey/faq`
- `/the-word`, `/the-word/program`, `/the-word/encounter`, `/the-word/understand`, `/the-word/discern`, `/the-word/commit`
- `/the-world`, `/the-world/program`, `/the-world/explore`, `/the-world/encounter`, `/the-world/listen`, `/the-world/understand`, `/the-world/opportunities`, `/the-world/research`
- `/the-work`, `/the-work/program`, `/the-work/choose-role`, `/the-work/co-design`, `/the-work/mission-model`, `/the-work/experiment`, `/the-work/serve`, `/the-work/multiply`

**Publishing and impact**
- `/blog`, `/blog/[slug]`, optional `/blog/category/[slug]`
- `/news`, `/news/[slug]`, optional `/news/category/[slug]`
- `/stories/field` (only genuine, permissioned field stories)
- `/impact`, `/impact/projects`, `/impact/projects/[slug]` (no fictitious verified projects)
- `/resources`, `/resources/frameworks`, `/resources/worksheets`, `/resources/guides`, and valid resource detail pages
- `/partners` and `/events` when substantive data exists

**System**
- `/sitemap.xml`, `/robots.txt`, `/rss.xml`, Open Graph image, brand favicon, privacy policy, basic accessibility page
- `404` and proper empty states
- Studio/admin/preview/thank-you/guest-state routes protected and/or `noindex`, depending on their nature.

Important: direct GET to every public URL returns the content's **actual semantic HTML**, with meaningful title, H1, intro and internal `<a href>` links even if JavaScript/WebGL never runs. Do not hide main text only inside a `<canvas>`, textures, screenshots or delayed client-only fetch. Use normal links from city overlays and HTML menus. Never assume Googlebot will navigate an avatar.

## 7. CMS, news, blog and billboard publishing
Set up a **single source of truth** for content consumed by both 3D billboards and ordinary public HTML pages.

Preferred design: **structured headless CMS such as Sanity** with editorial roles and publish states. If Sanity credentials are not configured, implement a **working repo-backed MDX/JSON content adapter** with typed schemas and real public pages, plus a documented Sanity integration path and `.env.example`. No fake working admin UI; do not claim newsroom publish functionality before it has been demonstrated end-to-end.

Minimum models:
- `page`, `district`, `journeyStep`, `program`, `landmark`, `billboard`
- `blogPost`: slug, title, excerpt, author, date, category, featured image, body, references, status, SEO, related district
- `newsPost`: slug, verified headline, summary, body, author/editor, event date, publication date, sources, correction history, status, SEO
- `project`: problem/context, partners, consent/privacy, stage, evidence, verified outcomes, status
- `resource`: category, title, description, original author/source/license, version, download URL or learning link
- `event`: venue/online, date/time and timezone, organizer, registration state
- `partnerInquiry`: only if real server-side storage/email delivery is configured securely

Billboard fields: `slotId`, `districtId`, `headline`, `shortCopy`, `contentRef`, `targetUrl`, `priority`, `publishAt`, `unpublishAt`, `status`, `locale`. All billboard targets must resolve to published or intentionally explanatory content. Rotate displays with a small nonintrusive animation; stop animations when reduced-motion is enabled. Update CMS once → page, news listing, and world billboard all use updated information. If content is unpublished, it disappears from billboards and sitemaps as appropriate.

Content integrity:
- **No fabricated news**, partner testimonials, community photos passed as real, launch events, participant counts, case studies or impact numbers. Use only approved SocioLine vision/mission/program text as evergreen public seed content, and clearly label all other examples as fictional demos that remain non-indexed.
- `NewsArticle` markup only for actual news articles. Dated press releases are not to be presented as independent journalism.
- Editorial workflow: Draft → In Review → Published → Archived, scheduled publishing where supported, correction notes, proper authorship, traceable revisions and relevant images with alt text.
- The site is not dependent on the 3D engine to publish or display news.

## 8. SEO, discovery and web quality — hard acceptance requirements
Use Next.js App Router/TypeScript as default if compatible with repository; Server Components for content pages and client-only dynamic imports for WebGL. Public page render must not wait for GPU or avatar session.

Implement:
1. per-page unique `title`, `description`, canonical URL, Open Graph/Twitter metadata and image; configurable `NEXT_PUBLIC_SITE_URL` (do not invent a production domain).
2. semantic landmarks, exactly one meaningful H1 per main page, contextual H2/H3, descriptive anchor text, actual links from nav and related content.
3. `robots.txt`, generated `sitemap.xml` containing published indexable routes, appropriate RSS, proper redirect/404 states; never index draft, preview, avatar state, admin/studio or thank-you.
4. valid relevant JSON-LD: `Organization` with only known information, `WebSite`, `BreadcrumbList`, `BlogPosting`/`NewsArticle`/`Event` only when accurate and applicable. Do not mark up invented content.
5. blog/news detail HTML on first response, authors, publication and modification dates, references/corrections, related articles and district links.
6. image alt text, optimized images, no autoplay sound, accessible dialogs, keyboard nav in HTML layer, clear fallback without 3D.
7. internationalization-ready content model; default `id-ID`. English support can be a later feature; avoid automatic duplicate URLs without translations.
8. performance target for public HTML pages: LCP <=2.5 sec, INP <=200 ms, CLS <=0.1 on representative conditions. Aim separately for playable desktop 60 FPS on suitable hardware and mobile 30 FPS on defined targets; **measure** and report, do not claim numbers without tests.
9. WebGL delayed/lazy on request; properly dispose meshes/textures/handlers on transitions, avoid unnecessary render loops outside explore, add LOD/instancing/culling/adaptive DPR/streaming for scale.
10. include a test that inspects **server-returned HTML with JS disabled** on `/`, `/the-word`, `/the-world`, `/the-work`, `/programs/w3-journey`, one published blog article and one genuine/approved news item if available. Assert visible text and crawlable links. Don't create fake news merely to pass tests.

Follow current official documentation rather than assuming old API shapes:
- https://nextjs.org/docs/app
- https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- https://developers.google.com/search/docs/fundamentals/get-started-developers
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://r3f.docs.pmnd.rs/advanced/scaling-performance

SEO-friendly does **not** mean guaranteed indexing or guaranteed ranking; it means implemented best practices that are testable.

## 9. Suggested technical architecture
Adapt after repository inspection; do not unnecessarily rebuild working infrastructure.

- **Public web:** Next.js App Router, React, TypeScript, Tailwind CSS, accessible component library where helpful.
- **3D engine:** Three.js + `@react-three/fiber` + Drei, sensible physics/collision selection (evaluate Rapier if needed), route/landmark state separated from content model.
- **Game modules:** `CityScene`, `DistrictChunk`, `RoadNetwork`, `LandmarkRegistry`, `PlayerController`, `OrbitFollowCamera`, `AvatarCreator`, `AvatarRig`, `AnimationController`, `InteractionSystem`, `HUD`, `Minimap`, `FastTravel`, `BillboardRenderer`, `SceneQualityManager`, `LoadingOverlay`, `Fallback2DMap`.
- **Data:** typed content adapter (MDX/JSON initial; CMS adapter when configured), schema validation e.g. Zod. Use server-only secrets; never expose tokens in browser bundles.
- **Deployment:** Vercel-capable Next.js, with assets on public/static or configured object storage/CDN. Use a production-safe database/CMS only when actually needed; do not invent deployment credentials. Guest MVP must not need a database.
- **Asset pipeline:** original Blender → `.glb`/`.gltf`, compatible humanoid skeleton, mesh optimization (Draco/Meshopt where compatible), KTX2/textures when practical, LOD and instanced props. Keep an asset registry and licenses.
- **Server security:** input validation, anti-spam/rate limiting for any live forms, privacy-conscious analytics opt-in where applicable; admin/editor protected, no open publishing API. Do not implement multiplayer/chat/transactions in MVP.

Suggested folder areas (adjust to actual repository):
`app/(site)/...`, `app/explore/...`, `components/city/...`, `components/avatar/...`, `components/hud/...`, `components/content/...`, `lib/city/landmarks.ts`, `lib/content/...`, `lib/seo/...`, `content/...`, `public/assets/world/...`, `public/assets/avatars/...`, `tests/e2e/...`, `docs/...`.

## 10. Visual fidelity / art requirements
Use the user's example as visual reference: a city seen from an elevated vantage with **many blocks and actual roads**; there is depth and scale, not a floating miniature. With the approved SocioLine concept, a camera can reveal three regions from a central arrival hill/plaza, but gameplay must let the visitor descend to street level and explore.

Environmental detail checklist:
- Road grid/ring boulevard with crossings and road markings; walkable sidewalks and pedestrian spaces.
- Different building typologies (libraries/galleries, civic/research centers, towers, innovation laboratories); visible district variation.
- Trees, flower beds, plazas, benches, street lamps, flags and SocioLine brand elements; distributed enough to make the city feel inhabited.
- Billboard signage for Faithful / Contextual / Strategic / Sustainable and program/news highlights with real linked content.
- City skyline, horizon and atmospheric perspective; lighting and shadows; acceptable quality on lower-end devices via presets.
- NPC ambient movement can be deterministic and noninteractive for MVP; do not imply real multiplayer users if there are none.
- Character must have life-simulation/anime proportions; avoid square-block hands/head/limbs.
- All clickable world objects provide clear visual affordances, accessible text equivalent, and matching HTML links.

## 11. Milestone-by-milestone implementation — DO THE WORK
Execute in the following order; keep going within available execution, do not stop after a planning response:

**M0 — Repository audit & implementation plan**
- Inspect existing app and assets, identify available dependencies/credentials, and preserve user changes.
- Write `docs/architecture.md`, `docs/city-map.md` and an implementation checklist mapped to this prompt.
- Establish content URLs and district/landmark registry; record architectural choices.

**M1 — Playable vertical slice (highest priority)**
- Real Next.js homepage with server-rendered SocioLine overview, Word/World/Work links and CTA.
- `/explore` avatar creator (two presets, at least a working original stylized avatar), 3D Central Plaza and a meaningful block of The Word.
- WASD/touch movement, follow camera, collision, one real interactable building, HTML overlay, functional CTA to crawlable public route and fallback 2D map.
- A short controls tutorial, pause/escape handling, and browser reload survival.
- Add an automated happy-path test for spawn → move → interact → open content if feasible in browser.

**M2 — Connected playable city**
- Expand from M1 into walkable World and Work districts, connecting roads, at least the primary landmarks, atmospheric landmarks, HUD/minimap, fast travel/deep-linking.
- Ensure consistent art direction; maintain performance rather than adding endless empty blocks.

**M3 — Publishing and content systems**
- Real indexable public brand/program/resources/blog/news/impact routes; structured content adapter, editorial schemas, billboard data integration.
- Include carefully sourced evergreen SocioLine text; do not publish demo news or fabricated results.
- Establish read-only news panels and update flow: editorial content → published HTML → city billboard.
- Set up real forms only if backend delivery is configured; otherwise provide clearly marked not-yet-available states rather than a fake successful submission.

**M4 — Quality and launch gate**
- SEO-first server HTML test, metadata/sitemap/robots/RSS, accessibility test, mobile controls and fallback, broken-link checks, asset rights audit.
- Run lint, typecheck, tests and build. Attempt browser QA/screenshots and representative device/performance checks when tooling permits.
- Fix discovered problems. Do not mark a gate PASS without evidence.

**M5 — Future backlog only, NOT required to claim MVP:** seamless interiors everywhere, advanced animated NPC quests, online multiplayer/chat, account-backed journey sync, live events, Roblox-type optional skins, full opportunity exchange/transactions.

## 12. Definition of Done / tests
Deliver and verify:
- A runnable local repo with documented install/start/build commands and `.env.example`.
- A **real connected 3D scene** with Central Plaza and recognizable Word, World, Work districts; no static image masquerading as playable city.
- Guest avatar selection Male/Female, original non-blocky character, controls, mobile fallback, accessible menu.
- Walking across at least two connected zones physically; a landmark is approached and `E` or touch opens an actual HTML content panel.
- All core pages work by URL, even with WebGL disabled; H1, meaningful headings, links and content are present in server-returned HTML.
- Working Blog and News *read/publish pipeline as far as configured*; no false claim of functioning CMS if credentials are missing, and no fabricated news in published state.
- Landmark and billboard links resolve; HTML nav and fast travel are coherent.
- `robots.txt`, `sitemap.xml`, metadata, canonical, structured data for applicable pages, RSS; index/noindex policy.
- Accessible basic 2D site with keyboard navigation, reduced motion and clear mobile alternative.
- Honest progress report for fidelity, performance, tests and missing production integrations.

Run the relevant commands (adapt to package manager):
`install`, `lint`, `typecheck`, `test`, `build`, and Playwright/browser smoke tests if available. Inspect console errors, broken routes, hydration issues and HTML response. Provide exact results and commands.

## 13. What to return to the project owner
In Bahasa Indonesia, return:
1. **Apa yang benar-benar sudah dibangun** (features and representative routes).
2. **How to run** (commands, environment setup, optional CMS configuration, no secrets).
3. **Visual/browser evidence**: screenshots or preview URL only if actually generated/verified; never fabricate links or test results.
4. **SEO proof**: representative HTML response inspection, sitemap, metadata/structured-data verification, WebGL-off browse test.
5. **QA status table**: PASS / PARTIAL / BLOCKED with exact reason, including avatar, walking, collision, city, mobile, CMS, forms, SEO, performance.
6. **Remaining work prioritized**: high-quality avatar assets, more interiors, editorial credentials, deployment, production monitoring, and so on.
7. **Changed file list** plus git diff summary, without committing or deploying unless explicitly asked.

### Immediate execution command
**Start now by auditing the repository, then implement M1 in code. Continue to M2–M4 as practical in the same work session. Do not ask me to approve a design-only plan; the city/game/SEO direction in this prompt is approved. If blocked by credentials or missing 3D assets, implement a fully functional original local fallback, isolate the integration, report the exact blocker, and keep moving on work that does not depend on it.**