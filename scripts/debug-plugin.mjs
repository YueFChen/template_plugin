import { spawnSync } from 'node:child_process'
import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const coreRoot = path.resolve(pluginRoot, '../..')
const packageRoot = path.join(pluginRoot, 'target', 'dev-package')

for (const requiredPath of [
  path.join(coreRoot, 'package.json'),
  path.join(coreRoot, 'apps/desktop/src-tauri/tauri.conf.json'),
  path.join(coreRoot, 'packages/plugin-ui-sdk/package.json'),
]) {
  try {
    await access(requiredPath)
  } catch {
    throw new Error(
      'Open this plugin repository inside the Core checkout at plugins/<plugin-id> before running pnpm debug.',
    )
  }
}

const build = spawnSync(process.execPath, ['scripts/build-plugin.mjs'], {
  cwd: pluginRoot,
  stdio: 'inherit',
})
if (build.error) throw build.error
if (build.status !== 0) process.exit(build.status ?? 1)

const env = {
  ...process.env,
  WONDERLAND_DEV_PLUGIN_DIR: packageRoot,
}
const command = process.platform === 'win32'
  ? (process.env.ComSpec ?? 'cmd.exe')
  : 'pnpm'
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'pnpm.cmd dev']
  : ['dev']
const result = spawnSync(command, args, { cwd: coreRoot, env, stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
