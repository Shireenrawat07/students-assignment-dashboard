import React from 'react'
import test from 'node:test'
import assert from 'node:assert/strict'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { createServer } from 'vite'
import { demoUsers } from '../src/data/seedData.js'
import { SESSION_KEY } from '../src/utils/storage.js'

test('Professor and Student dashboards render from initialized context state', async () => {
  const server = await createServer({
    configFile: './vite.config.js',
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  })
  const originalWindow = globalThis.window

  try {
    const [{ AppProvider }, { default: AdminDashboard }, { default: StudentDashboard }] =
      await Promise.all([
        server.ssrLoadModule('/src/context/AppContext.jsx'),
        server.ssrLoadModule('/src/pages/AdminDashboard.jsx'),
        server.ssrLoadModule('/src/pages/StudentDashboard.jsx'),
      ])

    for (const [user, Dashboard, expectedText] of [
      [demoUsers.find((candidate) => candidate.role === 'admin'), AdminDashboard, 'Course management'],
      [demoUsers.find((candidate) => candidate.role === 'student'), StudentDashboard, 'Your assignments'],
    ]) {
      const values = new Map([[SESSION_KEY, user.email]])
      globalThis.window = {
        localStorage: {
          getItem: (key) => values.get(key) ?? null,
          setItem: (key, value) => values.set(key, String(value)),
          removeItem: (key) => values.delete(key),
        },
      }

      const markup = renderToString(
        React.createElement(
          StaticRouter,
          { location: '/' },
          React.createElement(
            AppProvider,
            null,
            React.createElement(Dashboard, { theme: 'light', onToggleTheme: () => {} }),
          ),
        ),
      )
      assert.match(markup, new RegExp(expectedText))
    }
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
    await server.close()
  }
})
