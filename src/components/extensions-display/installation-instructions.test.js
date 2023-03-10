import React from "react"
import { render, screen } from "@testing-library/react"
import InstallationInstructions from "./installation-instructions"

describe("extension installation instructions", () => {
  beforeEach(() => {
    render(
      <InstallationInstructions artifact="io.quarkiverse.rabbitmqclient:quarkus-rabbitmq-client::jar:0.3.0.CR3" />
    )
  })

  it("renders the mvn install command", () => {
    expect(
      screen.getByText(
        './mvnw quarkus:add-extension -Dextensions="io.quarkiverse.rabbitmqclient:quarkus-rabbitmq-client"'
      )
    ).toBeTruthy()
  })

  it("renders the cli install command", () => {
    expect(
      screen.getByText(
        'quarkus ext add io.quarkiverse.rabbitmqclient:quarkus-rabbitmq-client'
      )
    ).toBeTruthy()
  })
})
