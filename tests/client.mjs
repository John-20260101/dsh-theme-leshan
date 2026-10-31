#!/usr/bin/env node
/**
 * Browser smoke test for the generated `client.js`.
 *
 * Loads the real bundle into a blank page with a stub cordis context, applies
 * it, and checks the three things the plugin promises: a full 119-token layer
 * through `ctx.theme.overrideTokens`, the `data-dsh-leshan` attribute, and a
 * rail that survives a skin switch. A second page repeats the apply against a
 * strict-injection context whose proxy throws on undeclared service reads, so
 * the no-theme-service fallback stays regression-tested. Skips (exit 0) when no
 * local Chrome is available, so CI without a browser stays green.
 */
import { chromium } from 'playwright'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

let browser
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true })
} catch (error) {
  console.log('SKIP client smoke test — no Chrome available')
  process.exit(0)
}

const fail = (message) => {
  console.error(`FAIL ${message}`)
  process.exitCode = 1
}

try {
  const page = await browser.newPage()
  await page.setContent(
    '<!doctype html><html><head></head><body>' +
      '<div id="app">shell</div>' +
      '<div id="chat" data-conversation-region="chat"></div>' +
      '<div id="other-region" data-conversation-region="composer"></div>' +
      '</body></html>',
  )
  await page.evaluate(() => {
    window.__MOD = null
    window.__ModuleLoader__ = { load: (mod) => { window.__MOD = mod } }
    window.__LAYER = null
  })
  await page.addScriptTag({ content: await readFile(join(ROOT, 'client.js'), 'utf8') })
  await page.waitForFunction(() => window.__MOD !== null)

  const result = await page.evaluate(() => {
    const module = window.__MOD
    const effects = []
    const ctx = {
      effect(fn, label) {
        const dispose = fn()
        effects.push({ label, dispose })
        return () => {}
      },
      inject(deps, callback) {
        // The stub never resolves a late service; the direct property is enough.
      },
      theme: {
        overrideTokens(source, layer) {
          window.__LAYER = { source, layer }
          return () => { window.__DISPOSED = (window.__DISPOSED || 0) + 1 }
        },
      },
    }
    const plugin = module.factory(() => null)
    plugin.apply(ctx)
    const first = {
      id: window.__MOD.id,
      attr: document.documentElement.getAttribute('data-dsh-leshan'),
      source: window.__LAYER.source,
      tokens: Object.keys(window.__LAYER.layer).length,
      sample: window.__LAYER.layer['--dsw-alias-bg-base'],
      rail: document.querySelector('#dsh-theme-leshan-rail') !== null,
      shadow: document.querySelector('#dsh-theme-leshan-rail').shadowRoot !== null,
      effects: effects.map((item) => item.label),
      wash: document.documentElement.style.getPropertyValue('--leshan-a'),
      chatBg: getComputedStyle(document.getElementById('chat')).backgroundImage,
      chatAttachment: getComputedStyle(document.getElementById('chat')).backgroundAttachment,
      otherBg: getComputedStyle(document.getElementById('other-region')).backgroundImage,
    }
    const firstUrl = document.documentElement.style.getPropertyValue('--leshan-wallpaper')
    window.__DSH_LESHAN__.apply('emei')
    const second = {
      attr: document.documentElement.getAttribute('data-dsh-leshan'),
      disposed: window.__DISPOSED || 0,
      tokens: Object.keys(window.__LAYER.layer).length,
      url: document.documentElement.style.getPropertyValue('--leshan-wallpaper'),
      chatBg: getComputedStyle(document.getElementById('chat')).backgroundImage,
    }
    document.body.setAttribute('data-ds-dark-theme', '')
    const darkAccent = document.documentElement.style.getPropertyValue('--leshan-a')
    window.__DSH_LESHAN__.apply('lingyun')
    const wallpaper = {
      attr: document.documentElement.getAttribute('data-dsh-leshan-wallpaper'),
      url: document.documentElement.style.getPropertyValue('--leshan-wallpaper'),
      scrim: document.documentElement.style.getPropertyValue('--leshan-scrim-1'),
      tokens: Object.keys(window.__LAYER.layer).length,
    }
    return { first, firstUrl, second, darkAccent, lightAccent: first.wash, wallpaper }
  })

  if (result.first.id !== 'dsh-theme-leshan') fail(`module id ${result.first.id}`)
  if (result.first.attr !== 'sanjiang') fail(`initial skin ${result.first.attr}`)
  if (result.first.source !== 'dsh-theme-leshan') fail(`override source ${result.first.source}`)
  if (result.first.tokens !== 119) fail(`token count ${result.first.tokens}`)
  if (!result.first.sample || !result.first.sample.light) fail('token values are not {light,dark} pairs')
  if (!result.first.rail || !result.first.shadow) fail('rail missing or not in a shadow root')
  if (!result.firstUrl.includes('leshan-sanjiang')) fail(`first wallpaper url ${result.firstUrl}`)
  if (!result.first.chatBg.includes('leshan-sanjiang')) fail(`chat canvas did not paint the photo (${result.first.chatBg})`)
  if (!result.first.chatBg.includes('linear-gradient')) fail('chat canvas has no scrim above the photo')
  if (!result.first.chatAttachment.split(',').every((value) => value.trim() === 'fixed')) {
    fail(`chat canvas attachment is ${result.first.chatAttachment}`)
  }
  if (result.first.otherBg !== 'none') fail(`non-chat conversation region was painted (${result.first.otherBg})`)
  if (result.second.attr !== 'emei') fail(`switch did not land on emei (${result.second.attr})`)
  if (result.second.disposed < 1) fail('previous token layer was not disposed on switch')
  if (result.second.tokens !== 119) fail('switched layer is incomplete')
  if (!result.second.url.includes('leshan-emei')) fail(`switch kept the old wallpaper (${result.second.url})`)
  if (!result.second.chatBg.includes('leshan-emei')) fail(`chat canvas kept the old photo (${result.second.chatBg})`)
  if (result.lightAccent === result.darkAccent) fail('accent did not follow the appearance')
  if (result.wallpaper.attr === null) fail('wallpaper skin did not set the attribute')
  if (!result.wallpaper.url.includes('leshan-lingyun')) fail(`wallpaper url ${result.wallpaper.url}`)
  if (!result.wallpaper.scrim.startsWith('rgba')) fail('wallpaper scrim is not translucent')
  if (result.wallpaper.tokens !== 119) fail('wallpaper skin layer is incomplete')

  // --- strict-injection shell ------------------------------------------------
  // The desktop shell's cordis proxy throws on any service read that is not
  // declared in `inject`, before the caller's own `typeof` guard can run. The
  // plugin declares `inject: []`, so it must never touch `ctx.theme` directly;
  // it has to discover the service through `ctx.get` and fall back when absent.
  const guarded = await browser.newPage()
  await guarded.setContent('<!doctype html><html><head></head><body><div id="app">shell</div></body></html>')
  await guarded.evaluate(() => {
    window.__MOD = null
    window.__ModuleLoader__ = { load: (mod) => { window.__MOD = mod } }
  })
  await guarded.addScriptTag({ content: await readFile(join(ROOT, 'client.js'), 'utf8') })
  await guarded.waitForFunction(() => window.__MOD !== null)
  const strict = await guarded.evaluate(() => {
    const module = window.__MOD
    const injected = []
    const base = {
      effect(fn) {
        const dispose = fn()
        return () => { if (typeof dispose === 'function') dispose() }
      },
      inject(deps) {
        // Parking a fiber here is what froze the desktop boot screen.
        injected.push(...(Array.isArray(deps) ? deps : Object.keys(deps)))
      },
      // cordis exposes `on` on every context; the plugin subscribes instead of injecting.
      on() {
        return () => {}
      },
      // No theme service on this shell.
      get() {
        return undefined
      },
    }
    const ctx = new Proxy(base, {
      get(target, prop, receiver) {
        if (typeof prop === 'string' && !(prop in target)) {
          throw new Error(`cannot get property "${prop}" without inject`)
        }
        return Reflect.get(target, prop, receiver)
      },
    })
    let guardActive = false
    try {
      void ctx.theme
    } catch (error) {
      guardActive = /without inject/.test(error.message)
    }
    const plugin = module.factory(() => null)
    let threw = null
    try {
      plugin.apply(ctx)
    } catch (error) {
      threw = String((error && error.message) || error)
    }
    const style = document.getElementById('dsh-theme-leshan/fallback')
    return {
      guardActive,
      threw,
      injected,
      attr: document.documentElement.getAttribute('data-dsh-leshan'),
      fallback: style !== null,
      declarations: style === null ? 0 : (style.textContent.match(/--dsw-[a-z0-9-]+:/g) || []).length,
      rail: document.querySelector('#dsh-theme-leshan-rail') !== null,
    }
  })
  await guarded.close()

  if (!strict.guardActive) fail('strict-injection guard did not engage — the case proves nothing')
  if (strict.threw !== null) fail(`apply threw on a strict-injection ctx: ${strict.threw}`)
  if (strict.injected.includes('theme')) {
    fail('plugin parked an injection for an unavailable theme service (freezes the shell boot)')
  }
  if (strict.attr !== 'sanjiang') fail(`strict ctx did not paint (${strict.attr})`)
  if (!strict.fallback) fail('strict ctx did not fall back to the scoped stylesheet')
  if (strict.declarations !== 238) fail(`fallback sheet has ${strict.declarations} declarations, want 238`)
  if (!strict.rail) fail('strict ctx did not mount the rail')

  if (process.exitCode !== 1) {
    console.log(
      `client OK — 119 tokens, rail, switch, chat canvas, ${result.first.effects.length} effects, strict-injection fallback`,
    )
  }
} finally {
  await browser.close()
}
