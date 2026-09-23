// The catalog. Each entry becomes a card on the home page and its own page at
// /games/<slug>/. Games appear on the site in the order they're listed here.
//
// To add a game, copy an entry and fill it in. The build checks every entry
// and stops with a clear message if a required field is missing. Field notes:
//
//   slug         URL name, lowercase-with-dashes. Usually the repo name.
//   url          Where the game itself is hosted (its GitHub Pages address).
//   repo         Source code link, for your reference. Not shown on the site.
//   cover        Screenshot in src/static/img/games/, 600x800 (3:4 portrait).
//                Optional: without one the card shows a coloured title plate.
//   og           Social-share image in src/static/img/og/, 1200x630. Optional.
//   category     One of the keys in `categories` below; drives the filter chips.
//   orientation  'portrait' or 'landscape': the shape of the in-page player.
//   embed        false to skip the in-page player and only link out, for games
//                that need a whole tab (pointer lock, orientation lock, etc.).
//   accent/tint  Card colours: a strong colour for the badge dot and a pale one
//                for the badge background.
//   added        YYYY-MM-DD. The three newest games (if under 30 days old) get a "New" badge.
//   description  Paragraphs for the game page. Write these yourself: original,
//                substantial text on each page is what AdSense reviewers look for.
//   controls     Rows for the "How to play" table.

export const categories = {
  shooter: 'Shooter',
  arcade: 'Arcade',
  runner: 'Runner',
  driving: 'Driving',
  sports: 'Sports',
  puzzle: 'Puzzle',
}

export const games = [
  {
    slug: 'gig-ambulance',
    title: 'Gig Ambulance',
    tagline:
      'Crazy Taxi in an ambulance. Pick up patients around a pastel toy town and race them to the right hospital before time runs out.',
    url: 'https://mtd-public.github.io/gig-ambulance/',
    repo: 'https://github.com/mtd-public/gig-ambulance',
    cover: 'img/games/gig-ambulance.webp',
    og: 'img/og/gig-ambulance.jpg',
    category: 'driving',
    tags: ['3D', 'Time attack', 'Touch + keyboard'],
    orientation: 'portrait',
    accent: '#e2475a',
    tint: '#fdecee',
    added: '2026-09-22',
    featured: true,
    description: [
      "Gig Ambulance is a cute, low-poly rush-delivery game. It plays like Crazy Taxi, except you're behind the wheel of an ambulance: patients are waiting all over a pastel toy town, and each one has to reach their hospital before their timer runs out. Don't spill the granny.",
      "Stop inside a green beam to load a patient, then stop inside the red beam at their hospital. There are three hospitals, and only the right one counts. There's a side hustle too: roll through orange beams to grab up to three pizzas, even mid-run, and drop them at a pizzeria while they're still hot. Two compasses at the top of the screen point to your next patient stop and your next pizza stop.",
      "The whole town, from the cars and pedestrians to the hospitals and pizzerias, is a set of 61 low-poly models generated with Blender's Python API and rendered in the browser with three.js.",
    ],
    controls: [
      { action: 'Steer', touch: 'Left thumb: drag the floating stick', keyboard: 'WASD or arrow keys' },
      { action: 'Drift (handbrake)', touch: 'DRIFT button', keyboard: 'Space' },
      { action: 'Brake', touch: 'BRAKE button', keyboard: 'X' },
      { action: 'Boost', touch: 'BOOST button', keyboard: 'Shift' },
      { action: 'Rotate camera', touch: '⟳ button', keyboard: 'Q / E' },
    ],
    tips: [
      'Drift through corners instead of braking. You keep more speed.',
      "Pizzas are a side gig: grab them when they're on your way, not as a detour.",
      'Rotate the camera 90° when a building hides the road ahead.',
    ],
    builtWith: ['three.js', 'Blender', 'JavaScript', 'Web Audio'],
  },
  {
    slug: 'labyrinth-larry',
    title: 'Labyrinth Larry',
    tagline:
      'Marble Madness in Hell. Roll a screaming soul in an iron gyro-cage down five circles of a burning labyrinth before the sands run out.',
    url: 'https://mtd-public.github.io/labyrinth-larry/',
    repo: 'https://github.com/mtd-public/labyrinth-larry',
    cover: 'img/games/labyrinth-larry.webp',
    og: 'img/og/labyrinth-larry.jpg',
    category: 'arcade',
    tags: ['3D', 'Physics', 'Touch + keyboard'],
    orientation: 'portrait',
    accent: '#b8321f',
    tint: '#fbe9e4',
    added: '2026-09-23',
    featured: true,
    description: [
      "Larry died, and Hell put him in a cage. Labyrinth Larry is a Marble Madness-style arcade game in which you roll Larry, strapped inside a giant iron gyro-cage, down torch-lit dungeon courses floating over a sea of fire. Get him into the hellmouth at the bottom of each circle before the sands run out.",
      "The five circles escalate quickly. The Threshold teaches ramps, ledges and safe drops. Asphodel Descent sends soul orbs after you across crumbling bone bridges. Leviathan's Chains swings Hellraiser hooks across narrow walkways, River Phlegethon adds lava tiles and flame vents, and The Labyrinth stacks two walled mazes down a cliff. Fall further than a man is tall and Larry breaks, so you respawn at the last rune-circle checkpoint and lose the time.",
      'Everything is procedural: the courses, the cage and the torches are built from three.js primitives and canvas textures, and every scream is synthesised live with Web Audio.',
    ],
    controls: [
      { action: 'Roll', touch: 'Press anywhere and drag toward where Larry should go. Release to coast', keyboard: 'WASD or arrow keys' },
      { action: 'Pause', touch: 'II button', keyboard: 'P' },
      { action: 'Mute', touch: '♪ button', keyboard: 'M' },
    ],
    tips: [
      'How far you drag is your throttle. Ease off near edges.',
      'Lament boxes add five seconds, and leftover time carries into the next circle as a bonus.',
      'Short drops just clank. Only long falls cost a life.',
    ],
    builtWith: ['three.js', 'JavaScript', 'Web Audio'],
  },
  {
    slug: 'sub-sinkers',
    title: 'Sub Sinkers',
    tagline:
      "A 16-bit side-scrolling submarine shooter. Torpedo what's ahead, missile what's above, and dive through four ocean zones.",
    url: 'https://mtd-public.github.io/sub-sinkers/',
    repo: 'https://github.com/mtd-public/sub-sinkers',
    cover: 'img/games/sub-sinkers.webp',
    og: 'img/og/sub-sinkers.jpg',
    category: 'shooter',
    tags: ['Pixel art', 'Boss fights', 'Landscape'],
    orientation: 'landscape',
    accent: '#1f7fc4',
    tint: '#e6f2fb',
    added: '2026-09-23',
    featured: true,
    description: [
      "Sub Sinkers is a 16-bit-style side-scrolling shooter set under the waves. Your little yellow submarine pushes forward through four stages, each one deeper than the last: the sunlit shallows of a busy harbour, a twilight reef under sunset oil rigs, the pitch-black midnight zone, and finally an ice-roofed trench eleven kilometres down.",
      'Torpedoes fire straight ahead at patrol subs, drones, tethered mines, jellyfish and walking crab mechs. Missiles launch upward, break the surface and take out the gunboats, helicopters and jets dropping depth charges and bombs on you. Every stage ends in a boss fight against a battleship or a dreadnought sub.',
      "There isn't a single image file in the game. Every sprite is drawn in code, shaded with palette ramps, ordered dithering and rim light, then recoloured to match the depth of each stage.",
    ],
    controls: [
      { action: 'Move', touch: 'Drag on the left side of the screen (floating joystick)', keyboard: 'Arrow keys or WASD' },
      { action: 'Torpedo (forward)', touch: '▶ button', keyboard: 'Space, J or Z' },
      { action: 'Missile (upward)', touch: '▲ button', keyboard: 'K, X or Shift' },
      { action: 'Pause', touch: 'II button', keyboard: 'P or Esc' },
    ],
    tips: [
      'Surface to ride the waves, or hug the seabed to slip under patrols.',
      'The screen only scrolls forward, so clear threats before you push ahead.',
      'Wrecked enemies sometimes drop P (more firepower) or + (hull repair).',
      'On a phone, turn it sideways. Sub Sinkers plays in landscape.',
    ],
    builtWith: ['JavaScript', 'Canvas 2D', 'Web Audio'],
  },
  {
    slug: 'finger-skater',
    title: 'Finger Skater',
    tagline:
      'A two-thumb isometric skateboarding game. Weave through toy-town traffic, ollie cars, grab big air and grind rails.',
    url: 'https://mtd-public.github.io/finger-skater/',
    repo: 'https://github.com/mtd-public/finger-skater',
    cover: 'img/games/finger-skater.webp',
    og: 'img/og/finger-skater.jpg',
    category: 'sports',
    tags: ['3D', 'Endless', 'Tricks'],
    orientation: 'portrait',
    accent: '#7a5bd6',
    tint: '#efeafc',
    added: '2026-09-22',
    description: [
      "Finger Skater is an endless isometric 3D skateboarding game for phones, in the spirit of Paperboy. You roll down a toy-town street full of traffic, cones, road works and pedestrians. Hop what you can, launch off ramps for big air, grab your board for trick points and lock onto rails to grind. Take three hits and you bail.",
      'It plays with two thumbs. The left steers with a virtual joystick; the right is a jump and trick button. Hold it to charge an ollie, release to jump, and hold again in the air to grab, but let go before you touch down or you eat it. Land lined up on a rail to grind, then keep the balance needle centred as it tips harder the longer you ride.',
      'Scoring rewards clean skating: distance is multiplied by your clean streak (up to x5), clearing a car pays 400, and ramps, grabs and grinds bank points for every second of air or rail time.',
    ],
    controls: [
      { action: 'Weave / balance', touch: 'Left joystick', keyboard: '← → or A / D' },
      { action: 'Ollie', touch: 'Hold the right button, release to jump', keyboard: 'Hold Space (or ↑ / W), release to jump' },
      { action: 'Grab trick', touch: 'Hold the right button in the air', keyboard: 'Hold Space in the air' },
      { action: 'Pop off a rail', touch: 'Tap the right button', keyboard: 'Tap Space' },
      { action: 'Switch camera', touch: '🎥 button', keyboard: 'C' },
    ],
    tips: [
      'A tap is a small hop. A full charge (about 0.8 s) clears a car.',
      'The air-time bar turns red with under 0.3 s left. Let go of the grab then.',
      'Coins are +25, hearts give back a hit and stars bump your streak.',
    ],
    builtWith: ['three.js', 'JavaScript', 'Web Audio'],
  },
  {
    slug: 'space-lion',
    title: 'Space Lion',
    tagline:
      'A toy-style top-down space shooter. Hunt the towers, fly the rings, break the Sentinel and slay the Space Lion.',
    url: 'https://mtd-public.github.io/space-lion/',
    repo: 'https://github.com/mtd-public/space-lion',
    cover: 'img/games/space-lion.webp',
    og: 'img/og/space-lion.jpg',
    category: 'shooter',
    tags: ['3D', 'Boss fights', 'Open world'],
    orientation: 'portrait',
    accent: '#5b46c9',
    tint: '#ecebfb',
    added: '2026-09-22',
    description: [
      'Space Lion is a top-down space shooter in the spirit of Xevious and Sinistar, built as a chunky 3D toy diorama. Your ship always flies forward. Steer with the thumbstick and tap anywhere to fire at a reticle fixed just ahead of your nose.',
      "Grumpy one-eyed turrets on floating islands track you and fire back (the pupil glows and the head shakes just before they shoot). Gold is scattered through the world, and ring courses pay a bonus when you fly them in order. The Sentinel, a recurring UFO mini-boss, keeps its damage between encounters: you can chip a third off its health each time before it warps away. Destroy it completely and the Space Lion itself comes for you.",
      'Every ship, tower, planet and crystal is generated in code, with thin ink outlines and soft drop shadows on a purple-twilight space mat.',
    ],
    controls: [
      { action: 'Steer', touch: 'Thumbstick, bottom-left. The ship keeps its heading when you let go', keyboard: 'WASD or arrow keys' },
      { action: 'Fire', touch: 'Tap or hold anywhere else', keyboard: 'Space' },
    ],
    tips: [
      'Circle the towers instead of flying straight at them.',
      'Ring courses only count in order, and they replay after a cooldown.',
      "When the Sentinel flees, it's coming back with the damage you did.",
    ],
    builtWith: ['three.js', 'JavaScript'],
  },
  {
    slug: 'splashy-fish',
    title: 'Splashy Fish',
    tagline:
      'Flappy Bird turned 90°. Splash against the current and dive past coral, anchors and mines into the abyss.',
    url: 'https://mtd-public.github.io/splashy-fish/',
    repo: 'https://github.com/mtd-public/splashy-fish',
    cover: 'img/games/splashy-fish.webp',
    og: 'img/og/splashy-fish.jpg',
    category: 'arcade',
    tags: ['One button', 'Endless', '3D'],
    orientation: 'portrait',
    accent: '#e8773a',
    tint: '#fdf0e7',
    added: '2026-09-22',
    description: [
      'Splashy Fish takes the Flappy Bird formula and turns it on its side. Your clownfish swims down the water column while a current keeps dragging it left. Your one action, splash, pushes it right for a moment. Thread the gaps in the coral reefs, chained anchors and moored mines that scroll up the screen as you descend.',
      'The deeper you go, the darker the water gets. The bright reef shallows fade into a purple twilight, but everything stays readable. On a phone held upright the board fills the screen; on a desktop it sits in a window beside your score and depth.',
      'The fish, coral and mines are chunky three.js toy shapes with ink outlines and soft shadows, in the same art style as Gig Ambulance.',
    ],
    controls: [
      { action: 'Splash (swim right)', touch: 'Tap the board or the Splash button', keyboard: 'Space or ↑' },
      { action: 'Pause', touch: 'Pause button', keyboard: 'P' },
    ],
    tips: [
      'Short, regular taps beat long bursts. The current never lets up.',
      'Look one gap ahead, not at the one you are passing.',
    ],
    builtWith: ['three.js', 'React', 'TypeScript', 'Vite'],
  },
  {
    slug: 'dive-depths',
    title: 'Dive Depths',
    tagline:
      'An endless vertical shooter. Your sub never stops sinking, so steer left and right and fire straight down at whatever rises from the dark.',
    url: 'https://mtd-public.github.io/dive-depths/',
    repo: 'https://github.com/mtd-public/dive-depths',
    cover: 'img/games/dive-depths.webp',
    og: 'img/og/dive-depths.jpg',
    category: 'shooter',
    tags: ['Pixel art', 'Endless', 'Boss fights'],
    orientation: 'portrait',
    accent: '#2f8a5b',
    tint: '#e6f4ec',
    added: '2026-09-22',
    description: [
      'Dive Depths turns the water column into a shooting gallery. Your submarine sinks endlessly while fish, sea monsters, enemy subs and mines rise up out of the dark to meet it. You have two jobs: steer left and right to stay alive, and fire missiles straight down to keep the depths clear.',
      'It began as a fork of Splashy Fish, took its touch controls from Professor WhipDash, and grew from there: weapon power-ups, a sustained laser ultimate, achievements, and boss fights that take over the whole screen at depth milestones.',
      'The sprites are pixel art in a two-tone palette. Pick a different palette from the options menu, or press C to cycle through them.',
    ],
    controls: [
      { action: 'Steer', touch: 'Tap the left or right half of the board, or swipe', keyboard: '← → or A / D (one step per press)' },
      { action: 'Fire', touch: 'Fire button', keyboard: 'Space' },
      { action: 'Pause', touch: 'Pause button', keyboard: 'P' },
      { action: 'Change palette', touch: 'Options menu (⚙)', keyboard: 'C' },
    ],
    tips: [
      'Steering moves in steps, so start moving early.',
      'Deal with mines before they reach your depth.',
    ],
    builtWith: ['React', 'TypeScript', 'Canvas 2D', 'Vite'],
  },
  {
    slug: 'prof-whip-dash',
    title: 'Professor WhipDash',
    tagline:
      'A three-lane endless runner down a Mayan causeway. Outrun a rockslide, crack your whip at spiders, and risk the boulder lane for triple gold.',
    url: 'https://mtd-public.github.io/prof-whip-dash/',
    repo: 'https://github.com/mtd-public/prof-whip-dash',
    cover: 'img/games/prof-whip-dash.webp',
    og: 'img/og/prof-whip-dash.jpg',
    category: 'runner',
    tags: ['3D', 'Endless', 'Swipe controls'],
    orientation: 'portrait',
    accent: '#b5462b',
    tint: '#f8ebe5',
    added: '2026-09-17',
    description: [
      "A fedora'd academic outruns a rockslide down a sacbé, the white limestone causeway of a Mayan city. Professor WhipDash is a three-lane endless runner with a twist: the boulders chase you from behind, and they grind rather than splat. Share a lane with one and you bleed until you reach a clear lane.",
      "That's a problem, because the gold is exactly where the boulders are. Most coin runs are threaded through a lane a boulder owns, and every coin you collect while being ground pays triple. Spiders and jade scarabs block the way ahead, and the answer to those is a well-timed crack of the whip.",
      'Every model, from the runner and the boulders to the pyramids and serpent balustrades, is assembled from three.js primitives at runtime and lit by a single key light behind the runner, so the boulders throw their shadows up the lane you are about to run.',
    ],
    controls: [
      { action: 'Switch lane', touch: 'Tap a side of the screen, or swipe', keyboard: '← →' },
      { action: 'Crack the whip', touch: 'Whip button, bottom right', keyboard: 'Space' },
      { action: 'Pause', touch: 'Pause button', keyboard: 'P' },
    ],
    tips: [
      'A red pip marks the lane that is grinding you.',
      'Dip into a boulder lane for triple coins, then get out before you bleed out.',
      'The whip hits what is ahead of you, so crack it early.',
    ],
    builtWith: ['three.js', 'React', 'TypeScript', 'Vite'],
  },
  {
    slug: 'word-drop',
    title: 'Word Drop',
    tagline:
      'Falling blocks where every block is a letter. Stack pieces to spell words across or down, and clear them for points.',
    url: 'https://mtd-public.github.io/word-drop/',
    repo: 'https://github.com/mtd-public/word-drop',
    cover: 'img/games/word-drop.webp',
    og: 'img/og/word-drop.jpg',
    category: 'puzzle',
    tags: ['Words', 'Falling blocks', 'Swipe controls'],
    orientation: 'portrait',
    accent: '#e5483b',
    tint: '#fdeceb',
    added: '2026-09-15',
    description: [
      'Word Drop crosses a falling-block puzzle with a word game. Every piece is made of letter tiles. Move it, rotate it and drop it onto the stack, and any run of three or more letters that spells a word, across or down, clears for points.',
      'Rotating a piece carries its letters around with it, so one turn can turn a dead end into a word. Longer words pay far more: 50 points for three letters, 100 for four, 200 for five and 400 for six, multiplied by your level. Every five words takes you up a level, and the pieces start falling faster.',
      'A words panel keeps a history of everything you have spelled, so you can see how the round went.',
    ],
    controls: [
      { action: 'Move', touch: 'Swipe left or right, or the ◀ ▶ buttons', keyboard: '← →' },
      { action: 'Rotate', touch: 'Rotate button', keyboard: '↑ or X' },
      { action: 'Soft drop', touch: 'Swipe down', keyboard: '↓' },
      { action: 'Fast drop', touch: '', keyboard: 'Space' },
      { action: 'Pause', touch: 'Pause button', keyboard: 'P' },
    ],
    tips: [
      'Look for common endings like -ED, -ER and -ING when you place pieces.',
      'Keep vowels spread across the board so both rows and columns can make words.',
    ],
    builtWith: ['React', 'TypeScript', 'Framer Motion', 'Vite'],
  },
]
