import rehypeReact from 'rehype-react'
import Layout from '../components/layout'
import React from 'react'
import { graphql } from 'gatsby'
import { Link } from 'gatsby'
import get from 'lodash/get'
import './post.css'

const SmartLink = ({ href, to, children, ...props }) => {
  let address = href || to
  let isExternal = false
  if (!address) {
    address = '/'
  } else if (
    address.indexOf('http://') === 0 ||
    address.indexOf('https://') === 0 ||
    address.indexOf('//') === 0
  ) {
    isExternal = true
  }
  if (isExternal) {
    return (
      <a href={address} {...props}>
        {children}
      </a>
    )
  }
  return (
    <Link to={address} {...props}>
      {children}
    </Link>
  )
}

const renderAst = new rehypeReact({
  createElement: React.createElement,
  components: { a: SmartLink },
}).Compiler

export default function Template({
  data, // this prop will be injected by the GraphQL query below.
}) {
  const { markdownRemark } = data // data.markdownRemark holds our post data
  const { frontmatter, htmlAst, fields } = markdownRemark
  const title = get(frontmatter, 'title', '[undefined]')
  const timeToRead = get(markdownRemark, 'timeToRead', '1')
  const date = get(frontmatter, 'date', get(fields, 'createdDate'))
  return (
    <Layout>
      <article className="post">
        <main className="post__inner">
          <section className="post__header">
            <div className="post__header__meta">
              <h1 className="post__title">{title}</h1>
              <h3 className="post__date">{date}</h3>
              <div className="post__time-to-read">
                Time to read: {timeToRead} minute
                {timeToRead === 1 ? '' : 's'}
              </div>
            </div>
          </section>
          <section className="post__body">{renderAst(htmlAst)}</section>
          <section className="post__footer">
            {fields.siblings.prev.path ? (
              <div>
                Previous Post:{' '}
                <Link to={fields.siblings.prev.path}>
                  {fields.siblings.prev.title}
                </Link>
              </div>
            ) : (
              ''
            )}
            {fields.siblings.next.path ? (
              <div>
                Next Post:{' '}
                <Link to={fields.siblings.next.path}>
                  {fields.siblings.next.title}
                </Link>
              </div>
            ) : (
              ''
            )}
          </section>
        </main>
      </article>
    </Layout>
  )
}

export const pageQuery = graphql`
  query($path: String!) {
    markdownRemark(fields: { permalink: { eq: $path } }) {
      html
      htmlAst
      frontmatter {
        # date(formatString: "MMMM D, YYYY")
        title
      }
      timeToRead
      fields {
        modifiedDate
        createdDate
        siblings {
          prev {
            path
            title
          }
          next {
            path
            title
          }
        }
      }
    }
  }
`
