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

let currentEffect = null
let currentKey = null

let paused = false

export const pauseTracking = () => {
  paused = true
}

export const resumeTracking = () => {
  paused = false
}

const objectMap = new WeakMap()

export const track = (target, key) => {
  console.log('Tracking:', key)
  if (currentEffect) {
    if (paused) {
      return
    }
    if (currentKey !== null && key !== currentKey) {
      return
    }
    let effectsMap = objectMap.get(target)
    if (!effectsMap) {
      effectsMap = new Map()
      objectMap.set(target, effectsMap)
    }

    const keys = key.split('.')
    let currentMap = effectsMap

    keys.forEach((k, index) => {
      // Ensure currentMap is a Map before accessing it
      if (!(currentMap instanceof Map)) {
        console.error(`Expected currentMap to be a Map, but found ${typeof currentMap}`)
        return
      }

      if (!currentMap.has(k)) {
        if (index === keys.length - 1) {
          // Create a Set at the final key
          currentMap.set(k, new Set())
        } else {
          // Create a Map for intermediate keys
          currentMap.set(k, new Map())
        }
      }

      currentMap = currentMap.get(k) // Move to the next level
    })

    // const finalKey = keys[keys.length - 1]
    const effects = currentMap instanceof Set ? currentMap : null
    if (effects) {
      effects.add(currentEffect)
    } else {
      console.error(`Expected a Set at finalKey, but found ${typeof effects}`)
    }

    // Log statements for debugging
    console.log(`Tracking key: ${key}`)
    console.log('Current Map after tracking:', JSON.stringify([...effectsMap], null, 2))
  }
}

export const trigger = (target, key, force = false) => {
  if (paused === true) return

  const effectsMap = objectMap.get(target)
  if (!effectsMap) {
    console.log('No effects map found for target', key)
    return
  }

  const keys = key.split('.')
  let currentMap = effectsMap
  for (let i = 0; i < keys.length; i++) {
    const currentKey = keys[i]

    if (!(currentMap instanceof Map)) {
      console.error(`Expected currentMap to be a Map, but found ${typeof currentMap}`)
      return
    }

    if (!currentMap.has(currentKey)) {
      console.log(`Key not found: ${currentKey}`)
      return
    }

    if (i === keys.length - 1) {
      const effects = currentMap.get(currentKey)
      if (effects instanceof Set) {
        console.log(`Triggering effects for key: ${key}`)
        for (let effect of effects) {
          console.log(`Effect triggered for: ${currentKey}`)
          effect(force)
        }
      } else {
        console.error(`Expected a Set at finalKey, but found ${typeof effects}`)
      }
    } else {
      currentMap = currentMap.get(currentKey)
    }
  }
}

export const effect = (effect, key = null) => {
  currentEffect = effect
  currentKey = key
  currentEffect()
  currentEffect = null
  currentKey = null
}
