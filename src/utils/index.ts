'use strict'

import assert from 'assert'
import brorand from 'brorand'

function randomEntropy(): Buffer {
  return Buffer.from(brorand(16))
}

function calculateChecksum(position: number, value: number): number {
  return value * (position * 2 + 1) % 9
}

function checkChecksum(position: number, value: number | string, checksum?: number): Boolean {
  if (typeof value === 'string') {
    assert.strictEqual(value.length, 6)
    checksum = parseInt(value.slice(5), 10)
    value = parseInt(value.slice(0, 5), 10)
  }
  return value * (position * 2 + 1) % 9 === checksum
}

function entropyToSecret(entropy: Buffer): Array<string> {
  const length = Array(Math.ceil(entropy.length / 2))
  const chunks = Array.apply(null, length).map((a, b) => {
    return entropy.slice(b * 2, ++b * 2)
  }).map((r, i) => {
    const no = parseInt(r.toString('hex'), 16)
    const fill = '0'.repeat(5 - String(no).length)
    return fill + String(no) + String(calculateChecksum(i, no))
  })
  assert.equal(chunks.length, 8)
  return chunks
}

function randomSecret(): Array<string> {
  return entropyToSecret(randomEntropy())
}

function secretToEntropy(secret: Array<string>): Buffer {
  return Buffer.concat(secret.map((r, i) => {
    const no = Number(r.slice(0, 5))
    const checksum = Number(r.slice(5))
    try {
      assert.strictEqual(r.length, 6)
    } catch (e) {
      throw new Error('Invalid secret: number invalid')
    }
    try {
      assert.strictEqual(checkChecksum(i, no, checksum), true)
    } catch (e) {
      throw new Error('Invalid secret part: checksum invalid')
    }
    const hex = ('0000' + no.toString(16)).slice(-4)
    return Buffer.from(hex, 'hex')
  }))
}

function parseSecretString(secret: string): Array<string> {
  secret = secret.replace(/[^0-9]/g, '')
  if (secret.length !== 48) {
    throw new Error('Invalid secret string (should contain 8 blocks of 6 digits')
  }
  return Array.apply(null, Array(8)).map((a, i) => {
    return secret.slice(i * 6, (i + 1) * 6)
  })
}

export {
  randomEntropy,
  randomSecret,
  entropyToSecret,
  secretToEntropy,
  calculateChecksum,
  checkChecksum,
  parseSecretString
}
