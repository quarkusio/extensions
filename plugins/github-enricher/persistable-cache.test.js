const PersistableCache = require("./persistable-cache")

describe("the persistable cache", () => {
  it("should set and get objects", () => {
    const cache = new PersistableCache()
    const rabbit = { rabbit: "bounce" }
    cache.set("rabbit", rabbit)
    const answer = cache.get("rabbit")
    expect(answer).toStrictEqual(rabbit)
  })

  it("should report if an object is in the cache", () => {
    const cache = new PersistableCache()
    let has = cache.has("frog")
    expect(has).toBeFalsy()

    const frog = { frog: "bounce" }
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

})