const type = "Repository"

const createRepository = ({ actions: { createNode }, createNodeId, createContentDigest }, { url, owner, project }) => {
  if (url) {
    createNode({
      id: url,
      url,
      owner, project,
      internal: { type, contentDigest: createContentDigest(url) }
    })
  }
}

const getResolvers = () => {
  const answer = {}

  async function findMatching(context, source) {
    return await context.nodeModel.findAll({
        query: {
          filter: {
            metadata: {
              sourceControl: {
                repository: { url: { eq: source.url } },
              }
            },
          }
        },
        type: `Extension`
      },
    )
  }

  answer[type] = {
    extensions: {
      type: "[Extension]",
      resolve: async (source, args, context) => {
        const answer = await findMatching(context, source)

        return Array.from(answer?.entries)
      }

    },
    extensionCount: {
      type: "Int",
      resolve: async (source, args, context) => {
        const answer = await findMatching(context, source)

        return Array.from(answer?.entries).length
      }

    }
  }
  return answer
}


module.exports = { createRepository, getResolvers }