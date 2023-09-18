const PersistableCache = require("./persistable-cache")

const time = jest.useFakeTimers()

describe("the persistable cache", () => {
  const frog = { frog: "bounce" }
  const rabbit = { rabbit: "bounce" }


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
    const cache = new PersistableCache()

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
    // expect(cache2.has("frog")).toBeFalsy()
    const thirdDump = cache2.dump()
    expect(thirdDump).toStrictEqual([])

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

})