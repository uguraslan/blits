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

export default (template = '') => {
  let cursor = 0

  const parse = () => {
    const output = { children: [] }
    while (template[cursor]) {
      if (template.charCodeAt(cursor) === '<'.charCodeAt(0)) {
        if (template.charCodeAt(cursor + 1) === '/'.charCodeAt(0)) {
          return output
        }
        if (template.substring(cursor + 1, cursor + 4) === '!--') {
          cursor = template.indexOf('-->', cursor) + 3
        } else {
          parseNode(output)
        }
      }
      cursor++
    }

    return output
  }

  const parseNode = (output) => {
    const endPosition = template.indexOf('>', cursor)
    const tag = parseTag(template.substring(cursor + 1, endPosition))
    const node = { ...{ type: tag.type }, ...tag.attributes }
    // self closing tag
    if (template.charCodeAt(endPosition - 1) === '/'.charCodeAt(0)) {
      output.children.push(node)
    } else {
      cursor = endPosition
      const nested = parse()
      if (nested.children.length) {
        node.children = [...nested.children]
      } else {
        const content = template.substring(endPosition + 1, cursor).trim()
        if (content) node.slotcontent = content
      }
      output.children.push(node)
    }
  }

  const parseTag = (tag) => {
    let match
    const result = {
      type: (match = tag.match(/^([A-Za-z0-9]+)(?![A-Za-z0-9=])/)) && match[0], // || 'Element' maybe default to 'Element'
    }

    const attributes = tag.match(/[:*\w.-]+="[^"]*"/g) || []
    if (attributes.length) {
      result['attributes'] = attributes.reduce((obj, attr) => {
        const match = /(.+)=["'](.+)["']/.exec(attr)
        if (match) {
          if (match[1].indexOf('.') > -1) {
            const parts = match[1].split('.')
            obj[parts[0]] = `{${parts[1]}: ${match[2]}}`
          } else {
            obj[match[1]] = match[2]
          }
        }
        return obj
      }, {})
    }

    return result
  }

  return parse()
}