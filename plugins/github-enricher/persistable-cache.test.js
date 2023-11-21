const PersistableCache = require("./persistable-cache")
const { dir } = require("tmp-promise")
require("tmp-promise").setGracefulCleanup()

const time = jest.useFakeTimers()

describe("the persistable cache", () => {
  let cachePath

  const frog = { frog: "bounce" }
  const rabbit = { rabbit: "bounce" }

  beforeEach(async () => {
    const { path } = await dir({ unsafeCleanup: true })
    cachePath = path
  })


  it("should set and get objects", () => {
    const cache = new PersistableCache()
    cache.set("rabbit", rabbit)
    const answer = cache.get("rabbit")
    expect(answer).toStrictEqual(rabbit)
  })

  it("should report if an object is in the cache", () => {
    const cache = new PersistableCache()
    let has = cache.has("frog")
    expect(has).toBeFalsy()

    cache.set("frog", frog)
    has = cache.has("frog")
    expect(has).toBeTruthy()
  })

  it("should flush objects", () => {
    const cache = new PersistableCache()
    const elastic = { elastic: "bounce" }
    cache.set("elastic", elastic)
    let has = cache.has("elastic")
    expect(has).toBeTruthy()
    cache.flushAll()
    has = cache.has("elastic")
    expect(has).toBeFalsy()
  })

  it("should report the size correctly", () => {
    const cache = new PersistableCache()

    expect(cache.size()).toBe(0)
    // Populate data
    cache.set("frog", frog)
    expect(cache.size()).toBe(1)
    cache.set("rabbit", rabbit)
    expect(cache.size()).toBe(2)

  })

  it("should produce a dump that can be ingested for round-tripping", () => {
    const cache = new PersistableCache(cachePath)

    // Populate data
    cache.set("frog", frog)
    cache.set("rabbit", rabbit)

    const dump = cache.dump()
    expect(dump).not.toBeUndefined()

    const cache2 = new PersistableCache()
    cache2.ingestDump(dump)
    expect(cache2.has("frog")).toBeTruthy()
    expect(cache2.get("frog")).toStrictEqual(frog)

    // Now if we dump the cache, we should get something equal to the first dump
    const secondDump = cache2.dump()
    expect(secondDump).toStrictEqual(dump)

  })

  it("should wipe the dumped cache if the ttl has elapsed", () => {
    const ttl = 2 * 60 * 60
    const timeNow = Date.now()

    const cache = new PersistableCache({ stdTTL: ttl })

    // Populate data
    cache.set("frog", frog)
    cache.set("rabbit", rabbit)

    const dump = cache.dump()
    expect(dump).not.toBeUndefined()

    // It would be nice if we could also dump the options, but there's no API to allow it
    const cache2 = new PersistableCache({ stdTTL: ttl })
    cache2.ingestDump(dump)

    // Now run the clock forward a little bit
    const ttlInMs = ttl * 1000
    // Don't bother with a library since this is so simple
    time.setSystemTime(new Date(timeNow + ttlInMs / 2))

    expect(cache2.has("frog")).toBeTruthy()
    expect(cache2.get("frog")).toStrictEqual(frog)

    // Now run the time forward to past the original ttl
    time.setSystemTime(new Date(timeNow + 1.5 * ttlInMs))
    expect(cache2.has("frog")).toBeFalsy()
    const thirdDump = cache2.dump()
    expect(thirdDump).toStrictEqual([])

  })

  it("should should not even ingest expired content", () => {
    const ttl = 2 * 60 * 60
    const timeNow = Date.now()

    const cache = new PersistableCache({ stdTTL: ttl })

    // Populate data
    cache.set("frog", frog)
    cache.set("rabbit", rabbit)

    const dump = cache.dump()
    expect(dump).not.toBeUndefined()

    // Now run the clock forward a LOT, so that everything should be expired
    const ttlInMs = ttl * 1000
    time.setSystemTime(new Date(timeNow + 1000 * ttlInMs))
    const cache2 = new PersistableCache({ stdTTL: ttl })
    cache2.ingestDump(dump)

    // The cache should have kicked everything out
    expect(cache2.has("frog")).toBeFalsy()
    const thirdDump = cache2.dump()
    expect(thirdDump).toStrictEqual([])

  })

  it("should should not reset the expiry time on ingestion", () => {
    const ttl = 2 * 60 * 60
    const timeNow = Date.now()

    const cache = new PersistableCache({ stdTTL: ttl })

    // Populate data
    cache.set("frog", frog)
    cache.set("rabbit", rabbit)

    const dump = cache.dump()
    expect(dump).not.toBeUndefined()
    const frogIndex = 0
    const frogExpiry = dump[frogIndex].ts
    // Make sure that was the frog
    expect(dump[frogIndex].key).toBe("frog")

    // Now run the clock forward a little, so that nothing should be expired (even with jitter)
    const ttlInMs = ttl * 1000
    time.setSystemTime(new Date(timeNow + ttlInMs / 3))
    const cache2 = new PersistableCache({ stdTTL: ttl })
    cache2.ingestDump(dump)

    // Nothing should be kicked out
    expect(cache2.has("frog")).toBeTruthy()
    expect(cache2.get("frog")).toStrictEqual(frog)

    // Run the clock forward a touch more so that anything we set should live
    time.setSystemTime(new Date(timeNow + 2 * ttlInMs / 3))
    cache2.set("youngfrog", "whatever")

    // Now run the clock forward a little more, so that the original entries should be expired,
    // but new ones would not be
    time.setSystemTime(new Date(frogExpiry + 1))

    // The cache should have kicked the original frog out
    expect(cache2.has("frog")).toBeFalsy()

    // ... but the new one should still be there
    expect(cache2.has("youngfrog")).toBeTruthy()
  })

  it("gracefully handles ingesting undefined dumps", () => {
    const cache = new PersistableCache()
    cache.ingestDump(undefined)
    expect(cache.has("whatever")).toBeFalsy()
  })

  it("gracefully handles ingesting empty dumps", () => {
    const cache = new PersistableCache()
    cache.ingestDump([])
    expect(cache.has("whatever")).toBeFalsy()
  })

  it("should not persist to disk if there is no key set", async () => {
    const cache = new PersistableCache({ cachePath })

    // Populate data
    cache.set("frog", frog)

    await expect(cache.persist()).rejects.toThrow(/key/)
  })


  it("should persist and ingest from disk", async () => {
    const cache = new PersistableCache({ cachePath, key: "something" })

    // Populate data
    cache.set("apples", frog)
    cache.set("bananas", rabbit)

    await cache.persist()

    const cache2 = new PersistableCache({ cachePath, key: "something" })
    await cache2.ready()
    expect(cache2.has("apples")).toBeTruthy()
    expect(cache2.get("apples")).toStrictEqual(frog)
    expect(cache2.get("bananas")).toStrictEqual(rabbit)
    expect(cache2.size()).toBe(2)
  })

  it("should not ingest from disk if the keys are different", async () => {
    const cache = new PersistableCache({ cachePath, key: "something" })

    // Populate data
    cache.set("bowls", frog)
    cache.set("plates", rabbit)

    await cache.persist()

    const cache2 = new PersistableCache({ cachePath, key: "different" })
    expect(cache2.has("bowls")).toBeFalsy()
    expect(cache2.has("plates")).toBeFalsy()
  })

})