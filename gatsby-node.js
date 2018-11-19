/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

// You can delete this file if you're not using it
const path = require('path')
const _ = require('lodash')
let activeEnv = process.env.ACTIVE_ENV || process.env.NODE_ENV || 'development'
const postNodes = []

function siblingFields(node) {
  return node && _.get(node, 'fields.permalink')
    ? {
        path: node.fields.permalink,
        title: _.get(node, 'frontmatter.title', '[undefined]'),
        excerpt: _.get(node, 'excerpt'),
        timeToRead: _.get(node, 'timeToRead'),
      }
    : {
        path: null,
        title: null,
        excerpt: null,
        timeToRead: null,
      }
}

function addSibilingNodes(actions) {
  // console.log(postNodes)
  const { createNodeField } = actions
  for (let i = 0; i < postNodes.length; i += 1) {
    const currNode = postNodes[i]
    // const nextID = i + 1 < postNodes.length ? i + 1 : 0
    const nextID = i + 1 < postNodes.length ? i + 1 : -1
    // const prevID = i - 1 >= 0 ? i - 1 : postNodes.length - 1
    const prevID = i - 1 >= 0 ? i - 1 : -1
    const nextNode = nextID === -1 ? null : postNodes[nextID]
    const prevNode = prevID === -1 ? null : postNodes[prevID]

    createNodeField({
      node: currNode,
      name: 'siblings',
      // value: prevNode.fields.permalink,
      value: {
        prev: siblingFields(prevNode),
        next: siblingFields(nextNode),
      },
    })
  }
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { deleteNode, createNodeField } = actions

  if (node.internal.type === 'MarkdownRemark') {
    const fileNode = getNode(node.parent)

    let createdDate = new Date(fileNode.birthTime)
    let modifiedDate = new Date(fileNode.changeTime || fileNode.birthTime)
    let slug = _.kebabCase(
      _.get(node, 'frontmatter.slug', _.get(node, 'frontmatter.title'))
    )

    if (!slug || slug === '') {
      // if you want to add a date before
      // slug = `${createdDate.getFullYear()}-${createdDate.getMonth()}-${createdDate.getDate()}--${
      //   fileNode.name
      // }`
      slug = `${fileNode.name}`
    }

    let prefix = _.get(node, 'frontmatter.type')
      ? `/${_.kebabCase(node.frontmatter.type)}/`
      : '/'

    let permalink = prefix + slug

    //if they've provided an explicit path, we'll use that
    permalink = _.get(node, 'frontmatter.path', permalink)

    createNodeField({ node, name: 'permalink', value: permalink })

    //Add information about modified date
    createNodeField({
      node,
      name: 'createdDate',
      value: createdDate.toISOString(),
    })
    createNodeField({
      node,
      name: 'modifiedDate',
      value: modifiedDate.toISOString(),
    })
    // const parsedFilePath = path.parse(fileNode.relativePath)

    postNodes.push(node)
  }

  //This will be done every time
  addSibilingNodes(actions)
}

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions

  return graphql(`
    {
      allMarkdownRemark(limit: 1000) {
        edges {
          node {
            fileAbsolutePath
            fields {
              permalink
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    result.data.allMarkdownRemark.edges.forEach(({ node }) => {
      const permalink = _.get(node, 'fields.permalink')
      if (permalink) {
        const blogPostTemplate = path.resolve(`src/templates/post.js`)
        createPage({
          path: permalink,
          component: blogPostTemplate,
          context: {}, // additional data can be passed via context
        })
      }
    })
  })
}
