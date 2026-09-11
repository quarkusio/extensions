/* A marker for "we asked, and the answer is that this definitively does not exist".

There is an important difference between "GitHub told us this repository is gone" and "we could not
find out, because we were rate limited / timed out / GitHub had a wobble". The first is worth
remembering across builds; the second must not be, or one unlucky build poisons the cache for days.

So: fetches return ABSENT for the first case and plain undefined for the second. PersistableCache
persists ABSENT (it is a real answer) but not undefined (which it only holds in memory for the
current build, exactly as it did before).

isAbsent is a structural check rather than an identity check, because the marker has to survive
being serialised to disk and read back.
 */
const ABSENT = Object.freeze({ __absent: true })

const isAbsent = value => value?.__absent === true

module.exports = { ABSENT, isAbsent }
