import NodeCache from "node-cache"

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
}

module.exports = PersistableCache