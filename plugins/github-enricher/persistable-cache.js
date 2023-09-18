const NodeCache = require("node-cache")

// Vary the time to live to avoid mass extinctions
const jitterRatio = 0.35

class PersistableCache {

  constructor(options) {
    this.options = options
    this.cache = new NodeCache(options)
  }

  set(key, value) {
    const jitteredTtl = this.options?.stdTTL ? this.options.stdTTL + (this.options.stdTTL) * jitterRatio * (Math.random() - 0.5) : 0
    return this.cache.set(key, value, jitteredTtl)

  }

  get(key) {
    return this.cache.get(key)
  }

  has(key) {
    return this.cache.has(key)
  }

  flushAll() {
    return this.cache.flushAll()
  }

  dump() {
    let result = []

    // Write out the contents of the cache in a format suitable for mset
    const keys = this.cache.keys()

    keys.forEach((key) => {
      const entry = {
        key,
        val: this.cache.get(key),
        ts: this.cache.getTtl(key)
      }

      // If the entry  is evicted, it will have a key but no value, so don't dump it
      if (entry.val) {
        result.push(entry)
      }
    })

    return result
  }

  ingestDump(dump) {
    if (dump) {
      this.cache.mset(dump)
    }
  }

  size() {
    return this.cache.keys().length
  }
}

module.exports = PersistableCache