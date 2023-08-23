const NodeCache = require("node-cache")

class PersistableCache {

  constructor(options) {
    this.cache = new NodeCache(options)
  }

  set(key, value) {
    return this.cache.set(key, value)

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
}

module.exports = PersistableCache