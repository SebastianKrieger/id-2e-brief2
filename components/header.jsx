import React, { Component } from "react"
import { Flex, Box } from "rebass"
import Link from "next/link"

export class Header extends Component {
  render() {
    return (
      <header id="header">
        <div className="intro" id="page-top">
          <div className="overlay">
            <div className="container">
              <div className="row">
                <div className="col-md-8 col-md-offset-2 intro-text">
                  <h1>
                    {this.props.data ? this.props.data.title : "Loading"}
                    <span />
                  </h1>
                  <p>
                    {this.props.data ? this.props.data.paragraph : "Loading"}
                  </p>
                  <Flex justifyContent="center">
                    <Box
                      as="a"
                      mx={3}
                      href="https://github.com/SebastianKrieger/id-2e-brief2"
                      target="_blank"
                      className="btn btn-custom btn-lg page-scroll"
                    >
                      INSTALL SLACK MIR
                      <span
                        style={{
                          transform: "scale(-1, 1)",
                          display: "inline-block"
                        }}
                      >
                        R
                      </span>
                      OR
                    </Box>
                    <Link href="/dashboard">
                      <Box
                        as="a"
                        mx={3}
                        className="btn btn-custom btn-lg page-scroll"
                      >
                        Go to Dashboard
                      </Box>
                    </Link>
                  </Flex>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    )
  }
}

export default Header
