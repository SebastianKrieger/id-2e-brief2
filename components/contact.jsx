import React, { Component } from "react"
import { Flex, Box } from "rebass"
import Link from "next/link"

export class Contact extends Component {
  render() {
    return (
      <div>
        <div id="contact">
          <div className="container">
            <div className="col-md-8">
              <div className="row">
                <div className="section-title" style={{ marginBottom: "10px" }}>
                  <h2>
                    How To Install SLACK MIR
                    <span
                      style={{
                        transform: "scale(-1, 1)",
                        display: "inline-block"
                      }}
                    >
                      R
                    </span>
                    OR
                  </h2>
                  <p>
                    Slack Mirror is a free open source software anyone can
                    install in their own slack spaces.
                  </p>
                  <p>
                    You can also contribute to the codebase to improve the app
                    via the github repository.
                  </p>
                </div>
                <Flex name="sentMessage" style={{ marginTop: "20px" }}>
                  <Box
                    mr={4}
                    as="a"
                    target="_blank"
                    href="https://github.com/SebastianKrieger/id-2e-brief2"
                  >
                    <button
                      className="btn btn-custom btn-lg"
                      style={{ margin: 0 }}
                    >
                      GET SLACK MIR
                      <span
                        style={{
                          transform: "scale(-1, 1)",
                          display: "inline-block"
                        }}
                      >
                        R
                      </span>
                      ROR
                    </button>
                  </Box>
                  <Link href="/dashboard">
                    <Box as="a">
                      <button
                        className="btn btn-custom btn-lg"
                        style={{ margin: 0 }}
                      >
                        Go To Dashboard
                      </button>
                    </Box>
                  </Link>
                </Flex>
              </div>
            </div>
            <div className="col-md-3 col-md-offset-1 contact-info">
              <div className="contact-item">
                <p>
                  <span>
                    <i className="fa fa-bookmark" /> Knowledge Base
                  </span>{" "}
                  <a
                    href={this.props.data.phone}
                    target="_blank"
                    style={{ color: "rgba(255,255,255,.75)" }}
                  >
                    {this.props.data ? this.props.data.phone : "loading"}
                  </a>
                </p>
              </div>
              <div className="contact-item">
                <p>
                  <span>
                    <i className="fa fa-github" /> Codebase
                  </span>{" "}
                  <a
                    href={this.props.data.email}
                    target="_blank"
                    style={{ color: "rgba(255,255,255,.75)" }}
                  >
                    {this.props.data ? this.props.data.email : "loading"}
                  </a>
                </p>
              </div>
            </div>
            <div className="col-md-12">
              <div className="row">
                <div className="social">
                  <ul>
                    <li>
                      <a
                        href={this.props.data ? this.props.data.github : "/"}
                        target="_blank"
                      >
                        <i className="fa fa-github" />
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="footer">
          <div className="container text-center">
            <p>
              &copy; 2020 ID-2E Research Team at CODE University of Applied
              Science
            </p>
          </div>
        </div>
      </div>
    )
  }
}

export default Contact
