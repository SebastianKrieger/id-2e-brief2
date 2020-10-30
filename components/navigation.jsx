import React, { Component } from "react"

export class Navigation extends Component {
  render() {
    return (
      <nav id="menu" className="navbar navbar-default navbar-fixed-top">
        <div className="container">
          <div className="navbar-header">
            <button
              type="button"
              className="navbar-toggle collapsed"
              data-toggle="collapse"
              data-target="#bs-example-navbar-collapse-1"
            >
              {" "}
              <span className="sr-only">Toggle navigation</span>{" "}
              <span className="icon-bar" /> <span className="icon-bar" />{" "}
              <span className="icon-bar" />{" "}
            </button>
            <a className="page-scroll" href="#page-top">
              <img
                style={{
                  float: "left",
                  height: "50px",
                  display: "inline-block",
                  marginRight: "10px"
                }}
                src="img/logo.png"
              />
            </a>
            <a className="navbar-brand page-scroll" href="#page-top">
              <span className="flip" style={{ color: "#a8dda8" }}>
                SLACK
              </span>{" "}
              MIR
              <span
                style={{ transform: "scale(-1, 1)", display: "inline-block" }}
              >
                R
              </span>
              OR
            </a>{" "}
          </div>

          <div
            className="collapse navbar-collapse"
            id="bs-example-navbar-collapse-1"
          >
            <ul className="nav navbar-nav navbar-right">
              <li>
                <a href="#features" className="page-scroll">
                  Features
                </a>
              </li>
              <li>
                <a href="#about" className="page-scroll">
                  Motivation
                </a>
              </li>
              <li>
                <a href="#services" className="page-scroll">
                  Research
                </a>
              </li>
              <li>
                <a href="#portfolio" className="page-scroll">
                  Wicked Problem
                </a>
              </li>
              <li>
                <a href="#testimonials" className="page-scroll">
                  Interviews
                </a>
              </li>
              <li>
                <a href="#team" className="page-scroll">
                  Team
                </a>
              </li>
              <li>
                <a href="#contact" className="page-scroll">
                  Install
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    )
  }
}

export default Navigation
