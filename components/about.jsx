import React, { Component } from "react"

export class about extends Component {
  render() {
    return (
      <div id="about">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-6">
              {" "}
              <a href="https://id-2e.com" target="_blank">
                <img src="img/about.jpg" className="img-responsive" alt="" />
              </a>
              <div style={{ margin: "20px", textAlign: "center" }}>
                <a target="_blank" href="https://id-2e.com">
                  <button
                    className="btn btn-custom btn-lg"
                    style={{ margin: 0 }}
                  >
                    GO TO OUR KNOWLEDGE BASE
                  </button>
                </a>
              </div>
            </div>
            <div className="col-xs-12 col-md-6">
              <div className="about-text">
                <h2>Why Motivation Tracking?</h2>
                <p>
                  {this.props.data ? this.props.data.paragraph : "loading..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default about
