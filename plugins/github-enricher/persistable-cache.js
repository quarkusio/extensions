const NodeCache = require("node-cache")
const cacache = require("cacache")

// Vary the time to live to avoid mass extinctions
const jitterRatio = 0.35

// This is mostly useful for tests of consumers of this class; Hopefully tests aren't persisting data to disk, but we do not want any cross-talk with the live cache
const DEFAULT_CACHE_PATH = process.env.NODE_ENV === "test" ? "./.cache-github-api-for-tests" : "./.cache-github-api"


/* This is an in-memory cache, with the option to persist itself to disk, when persist() is called.
If a key and path are given, it will read from disk on initialisation.
There are two layers of cache; node-cache does the in-memory part, and cacache persists the serialized node cache into a larger on-disk cache.

The time to live option is in SECONDS.
 */
class PersistableCache {

  constructor(options) {
    this.options = options
    this.cache = new NodeCache(options)

    this.cachePath = this.options?.cachePath || DEFAULT_CACHE_PATH

    if (this.options?.key) {

      // Initialise asynchronously. That's not ideal to do in a constructor, but we don't want callers to have to fuss with our lifecycle.
      // Since this is a cache, it's ok if our data comes in asynchronously
      this.loaded = cacache.get(this.cachePath, this.options.key).then((stringified) => this.ingestDump(JSON.parse(stringified.data.toString()))
      ).catch(() => {
        // This will happen if nothing exists at the cache path, which is fine
        // Even debug is annoyingly noisy, since this is basically fine and expected console.debug(e)
      })
    } else {
      this.loaded = true
    }

  }

  // Mostly used for testing, but callers can also use it if they don't want to risk re-fetching data that could be loaded from disk
  ready() {
    return this.loaded
  }

  set(key, value) {
    const jitteredTtl = this.options?.stdTTL ? this.options.stdTTL + (this.options.stdTTL) * jitterRatio * (Math.random() - 1) : 0
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

  // Mostly used for testing
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

  // Mostly used for testing
  ingestDump(dump) {
    if (dump) {
      this.cache.mset(dump)
    }
  }

  size() {
    return this.cache.keys().length
  }

  async persist() {
    if (!this.options?.key) {
      throw new Error("No cache key was set.")
    }
    return cacache.put(this.cachePath, this.options.key, JSON.stringify(this.dump()))
  }

}

module.exports = PersistableCache