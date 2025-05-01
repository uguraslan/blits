/*
 * Copyright 2023 Comcast Cable Communications Management, LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import Settings from './settings.js'
import { initLog, Log } from './lib/log.js'
import engine from './engine.js'
import blitsPackageInfo from '../package.json' assert { type: 'json' }

export let renderer = {}
export const stage = {}

async function rendererVersion() {
  let rendererPackageInfo
  try {
    // Dynamically import the renderer package.json
    rendererPackageInfo = await import('../../renderer/package.json')
    if (rendererPackageInfo !== undefined) {
      return rendererPackageInfo.version
    }
  } catch (e) {
    // Fallback to renderer version in dependencies
    return blitsPackageInfo.dependencies['@lightningjs/renderer']
  }
}

export default (App, target, settings) => {
  Settings.set(settings)

  initLog()

  rendererVersion().then((v) => {
    Log.info('Blits Version ', blitsPackageInfo.version)
    Log.info('Renderer Version ', v)
  })

  stage.element = engine.Element

  renderer = engine.Launch(App, target, settings)
}
