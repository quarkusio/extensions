import { readPom } from "./pom-reader"

describe("the pom reader", () => {

  it("should process a normal pom cleanly", async () => {
    const pom = "<project xmlns=\"http://maven.apache.org/POM/4.0.0\"\n" +
      "         xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n" +
      "         xsi:schemaLocation=\"http://maven.apache.org/POM/4.0.0\n" +
      "https://maven.apache.org/xsd/maven-4.0.0.xsd\">\n" +
      "    <parent>\n" +
      "        <artifactId>quarkus-azure-functions-http-parent</artifactId>\n" +
      "        <groupId>io.quarkus</groupId>\n" +
      "        <version>3.7.2</version>\n" +
      "    </parent>\n" +
      "    <modelVersion>4.0.0</modelVersion>\n" +
      "\n" +
      "    <artifactId>quarkus-azure-functions-http</artifactId>\n" +
      "    <name>Quarkus - HTTP Azure Functions - Runtime</name>\n" +
      "    <description>Write Microsoft Azure functions</description>\n" +
      "\n" +
      "    <dependencies>\n" +
      "        <dependency>\n" +
      "            <groupId>io.quarkus</groupId>\n" +
      "            <artifactId>quarkus-vertx-http</artifactId>\n" +
      "        </dependency>\n  </dependencies>\n" +
      "\n" +
      "    <build>\n" +
      "        <plugins>\n" +
      "            <plugin>\n" +
      "                <groupId>io.quarkus</groupId>\n" +
      "                <artifactId>quarkus-extension-maven-plugin</artifactId>\n" +
      "            </plugin>\n" +
      "            <plugin>\n" +
      "                <artifactId>maven-compiler-plugin</artifactId>\n" +
      "                <configuration>\n" +
      "                    <annotationProcessorPaths>\n" +
      "                        <path>\n" +
      "                            <groupId>io.quarkus</groupId>\n" +
      "                            <artifactId>quarkus-extension-processor</artifactId>\n" +
      // eslint-disable-next-line no-template-curly-in-string
      "                            <version>${project.version}</version>\n" +
      "                        </path>\n" +
      "                    </annotationProcessorPaths>\n" +
      "                </configuration>\n" +
      "            </plugin>\n" +
      "        </plugins>\n" +
      "    </build>\n" +
      "\n" +
      "</project>\n"
    const processed = await readPom(pom)

    expect(processed.relocation).toBeFalsy()

  })

  it("should detect relocations", async () => {
    const relocationPom = " <?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
      "<project xmlns=\"http://maven.apache.org/POM/4.0.0\"\n" +
      "         xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n" +
      "         xsi:schemaLocation=\"http://maven.apache.org/POM/4.0.0\n" +
      "https://maven.apache.org/xsd/maven-4.0.0.xsd\">\n" +
      "    <parent>\n" +
      "        <artifactId>quarkus-relocations-parent</artifactId>\n" +
      "        <groupId>io.quarkus</groupId>\n" +
      "        <version>3.0.0.Beta1</version>\n" +
      "    </parent>\n" +
      "    <modelVersion>4.0.0</modelVersion>\n" +
      "\n" +
      "    <artifactId>quarkus-amazon-dynamodb</artifactId>\n" +
      "\n" +
      "    <distributionManagement>\n" +
      "        <relocation>\n" +
      "            <groupId>io.quarkiverse.amazonservices</groupId>\n" +
      "            <artifactId>quarkus-amazon-dynamodb</artifactId>\n" +
      "            <version>1.0.2</version>\n" +
      // eslint-disable-next-line no-template-curly-in-string
      "            <message>${project.groupId}:${project.artifactId} was relocated to\n" +
      // eslint-disable-next-line no-template-curly-in-string
      "io.quarkiverse.amazonservices:${project.artifactId} and is now managed by the\n" +
      // eslint-disable-next-line no-template-curly-in-string
      "io.quarkus.platform:quarkus-amazon-services-bom:${project.version}. Please,\n" +
      "update its groupId in the dependency declaration and import\n" +
      // eslint-disable-next-line no-template-curly-in-string
      "io.quarkus.platform:quarkus-amazon-services-bom:${project.version} in your\n" +
      "project configuration. For more information about this change, please, refer to\n" +
      "https://github.com/quarkusio/quarkus/wiki/Migration-Guide-2.6</message>\n" +
      "        </relocation>\n" +
      "    </distributionManagement>\n" +
      "</project>\n"

    const processed = await readPom(relocationPom)

    expect(processed.relocation).toBeTruthy()
    expect(processed.relocation.groupId).toEqual("io.quarkiverse.amazonservices")
    expect(processed.relocation.artifactId).toEqual("quarkus-amazon-dynamodb")

  })
})