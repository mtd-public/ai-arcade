// TV static for changing the channel: grey snow drawn at low resolution and
// scaled up, with a bright band rolling through it, plus an optional hiss.
// With reduced motion it's one still frame of snow that fades out.

const WIDTH = 128
const HEIGHT = 96
const FRAME_MS = 45 // about 22 fps: lively, without strobing

export function createStatic(canvas, { still = false } = {}) {
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d', { alpha: false })
  const image = ctx.createImageData(WIDTH, HEIGHT)
  const pixels = new Uint32Array(image.data.buffer)
  let raf = 0
  let last = 0
  let band = 0

  const draw = () => {
    // Keep grey between 30 and 215 so the average brightness stays steady.
    for (let i = 0; i < pixels.length; i++) {
      const v = (30 + Math.random() * 185) | 0
      pixels[i] = 0xff000000 | (v << 16) | (v << 8) | v
    }
    // A brighter band that rolls down the picture, like a detuned signal.
    band = (band + 7) % (HEIGHT + 24)
    for (let y = Math.max(0, band - 24); y < Math.min(HEIGHT, band); y++) {
      for (let x = 0; x < WIDTH; x++) {
        const i = y * WIDTH + x
        const v = Math.min(255, (pixels[i] & 0xff) + 40)
        pixels[i] = 0xff000000 | (v << 16) | (v << 8) | v
      }
    }
    ctx.putImageData(image, 0, 0)
  }

  const loop = (time) => {
    if (time - last >= FRAME_MS) {
      last = time
      draw()
    }
    raf = requestAnimationFrame(loop)
  }

  return {
    // A faint still frame of snow: the set is on, nothing is tuned in.
    idle() {
      cancelAnimationFrame(raf)
      draw()
      canvas.classList.remove('is-on')
      canvas.classList.add('is-idle')
    },
    start() {
      cancelAnimationFrame(raf)
      draw()
      canvas.classList.remove('is-idle')
      canvas.classList.add('is-on')
      if (!still) raf = requestAnimationFrame(loop)
    },
    stop() {
      cancelAnimationFrame(raf)
      canvas.classList.remove('is-on', 'is-idle')
    },
  }
}

// A short burst of hiss. Browsers only allow sound after a click or key press,
// which is when channels change anyway.
let audio = null

export function hiss({ seconds = 0.5, volume = 0.16 } = {}) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)()
    if (audio.state === 'suspended') audio.resume()
    const length = Math.floor(audio.sampleRate * seconds)
    const buffer = audio.createBuffer(1, length, audio.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    const source = audio.createBufferSource()
    source.buffer = buffer
    const filter = audio.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 2600
    filter.Q.value = 0.5
    const gain = audio.createGain()
    const now = audio.currentTime
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds)
    source.connect(filter).connect(gain).connect(audio.destination)
    source.start(now)
    source.stop(now + seconds)
  } catch {
    // No Web Audio: the picture still changes, just quietly.
  }
}
