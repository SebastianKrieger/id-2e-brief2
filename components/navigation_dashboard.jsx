import React, { Component } from "react"

export default () => {
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
          <a href="/">
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
          <a className="navbar-brand" href="/">
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
              <a href="#motivation" className="page-scroll">
                Motivation
              </a>
            </li>
            <li>
              <a href="#challenges" className="page-scroll">
                Challenges
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
