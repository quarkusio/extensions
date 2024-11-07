import React from "react"
import { render, screen } from "@testing-library/react"
import { useQueryParamString } from "react-use-query-param-string"
import userEvent from "@testing-library/user-event"
import TickyFilter from "./ticky-filter"

let mockQueryParamSearchString = undefined
let rerender = undefined

jest.mock("react-use-query-param-string", () => {

  const original = jest.requireActual("react-use-query-param-string")
  const setQueryParam = jest.fn().mockImplementation((val) => {
    mockQueryParamSearchString = val
  })
  return {
    ...original,
    useQueryParamString: jest.fn().mockImplementation(() => [mockQueryParamSearchString, setQueryParam, true]),
  }
})

describe("ticky filter", () => {
  const entries = ["toad", "tadpole", "treefrog"]

  describe("when there is a prettifier", () => {

    let user
    const filterer = jest.fn(() => {
      // cheat, since normally the parent will force a rerender, and the child does not use usestate to avoid infinite loops
      if (rerender) {
        try {
          rerender()
        } catch (e) {
          // This can happen if the component is already unmounted
        }
      }
    })

    beforeEach(() => {
      user = userEvent.setup()
      mockQueryParamSearchString = undefined
      const products = render(<TickyFilter filterer={filterer} entries={entries} label="Arbitrary Title"
                                           prettify={(a) => a.toUpperCase()} />)
      rerender = () => {
        products.rerender(<TickyFilter filterer={filterer} entries={entries} label="Arbitrary Title" />)
      }
    })

    it("renders a entries title", () => {
      expect(screen.getByText("Arbitrary Title")).toBeTruthy()
    })

    it("renders prettified individual entry names", () => {
      expect(screen.getByText("TOAD")).toBeTruthy()
      expect(screen.getByText("TADPOLE")).toBeTruthy()
    })

    it("renders tickboxes", () => {
      expect(screen.getAllByTitle("unticked")).toHaveLength(entries.length)
    })
    describe("when clicking a ticky box", () => {
      const entryName = "TREEFROG"
      beforeEach(async () => {
        await user.click(screen.getByText(entryName))
      })

      it("passes through the original entry name to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([entryName.toLowerCase()])
      })

      it("updates the ticky box icons", async () => {
        expect(screen.getByTitle("ticked")).toBeTruthy()
        expect(screen.getAllByTitle("unticked")).toHaveLength(
          entries.length - 1
        )
      })

      it("sets search parameters", async () => {

        const [, setQueryParam] = useQueryParamString()

        expect(setQueryParam).toHaveBeenCalledWith(entryName.toLowerCase())
      })
    })
  })

  describe("when there is no prettifier", () => {


    let user
    const filterer = jest.fn(() => {
      // cheat, since normally the parent will force a rerender, and the child does not use usestate to avoid infinite loops
      if (rerender) {
        try {
          rerender()
        } catch (e) {
          // This can happen if the component is already unmounted
        }
      }
    })

    describe("when the query string starts blank", () => {

      beforeEach(() => {
        user = userEvent.setup()
        mockQueryParamSearchString = undefined
        const products = render(<TickyFilter filterer={filterer} entries={entries} label="Arbitrary Title" />)
        rerender = () => {
          products.rerender(<TickyFilter filterer={filterer} entries={entries} label="Arbitrary Title" />)
        }
      })

      it("renders a entries title", () => {
        expect(screen.getByText("Arbitrary Title")).toBeTruthy()
      })

      it("renders individual entry names", () => {
        expect(screen.getByText("toad")).toBeTruthy()
        expect(screen.getByText("tadpole")).toBeTruthy()
      })

      it("renders tickboxes", () => {
        expect(screen.getAllByTitle("unticked")).toHaveLength(entries.length)
      })


      describe("when clicking a ticky box", () => {
        const entryName = "treefrog"
        beforeEach(async () => {
          await user.click(screen.getByText(entryName))
        })

        it("passes through the original entry name to the listener", () => {
          expect(filterer).toHaveBeenCalledWith([entryName])
        })

        it("updates the ticky box icons", async () => {
          expect(screen.getByTitle("ticked")).toBeTruthy()
          expect(screen.getAllByTitle("unticked")).toHaveLength(
            entries.length - 1
          )
        })

        it("sets search parameters", async () => {

          const [, setQueryParam] = useQueryParamString()

          expect(setQueryParam).toHaveBeenCalledWith(entryName.toLowerCase())
        })
      })

      describe("when clicking several ticky boxes", () => {
        const entryName = "treefrog"
        const otherName = "toad"
        beforeEach(async () => {
          await user.click(screen.getByText(entryName))
          await user.click(screen.getByText(otherName))
        })

        it("passes through the entry names to the listener", () => {
          expect(filterer).toHaveBeenCalledWith([
            entryName.toLowerCase(),
            otherName.toLowerCase(),
          ])
        })

        it("updates the ticky box icons", () => {
          expect(screen.getAllByTitle("unticked")).toHaveLength(
            entries.length - 2
          )
          expect(screen.getAllByTitle("ticked")).toHaveLength(2)
        })

        it("sets search parameters", async () => {

          const [, setQueryParam] = useQueryParamString()

          expect(setQueryParam).toHaveBeenCalledWith(entryName.toLowerCase() + "," + otherName.toLowerCase())
        })
      })

      describe("when un-clicking a ticky box", () => {
        const entryName = "treefrog"
        beforeEach(async () => {
          await user.click(screen.getByText(entryName))
          await user.click(screen.getByText(entryName))
        })

        it("passes through the filter to the listener", () => {
          expect(filterer).toHaveBeenCalledWith([entryName.toLowerCase()])
          expect(filterer).toHaveBeenCalledWith([])
        })

        it("updates the ticky box icons to go back to unticked", () => {
          expect(screen.queryAllByTitle("ticked")).toHaveLength(0)
          expect(screen.getAllByTitle("unticked")).toHaveLength(entries.length)
        })

        it("unsets search parameters", async () => {
          const [, setQueryParam] = useQueryParamString()
          expect(setQueryParam).toHaveBeenCalledWith(undefined)
        })
      })
    })
    describe("when the query string already has a entry", () => {
      const entryName = "Treefrog"

      beforeEach(() => {
        mockQueryParamSearchString = entryName.toLowerCase()
        const products = render(<TickyFilter filterer={filterer} entries={entries} label="Arbitrary Title" />)
        rerender = () => products.rerender(<TickyFilter filterer={filterer} entries={entries}
                                                        label="Arbitrary Title" />)
      })

      it("passes through the original entry name to the listener", () => {
        expect(filterer).toHaveBeenCalledWith([entryName.toLowerCase()])
      })

      it("updates the ticky box icons", () => {
        expect(screen.getAllByTitle("unticked")).toHaveLength(
          entries.length - 1
        )
        expect(screen.getByTitle("ticked")).toBeTruthy()
      })

      it("sets search parameters", async () => {

        const [, setQueryParam] = useQueryParamString()

        expect(setQueryParam).toHaveBeenCalledWith(entryName.toLowerCase())
      })
    })

    describe("when there is a prettifier", () => {

      beforeEach(() => {
        user = userEvent.setup()
        mockQueryParamSearchString = undefined
        const products = render(<TickyFilter filterer={filterer} entries={entries} label="Arbitrary Title"
                                             prettify={(a) => a.toUpperCase()} />)
        rerender = () => {
          products.rerender(<TickyFilter filterer={filterer} entries={entries} label="Arbitrary Title" />)
        }
      })

      it("renders a entries title", () => {
        expect(screen.getByText("Arbitrary Title")).toBeTruthy()
      })

      it("renders prettified individual entry names", () => {
        expect(screen.getByText("TOAD")).toBeTruthy()
        expect(screen.getByText("TADPOLE")).toBeTruthy()
      })

      it("renders tickboxes", () => {
        expect(screen.getAllByTitle("unticked")).toHaveLength(entries.length)
      })
    })
  })
})
