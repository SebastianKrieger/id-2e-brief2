import React, { Component } from "react"
import { map } from "ramda"
export class Gallery extends Component {
  render() {
    return (
      <div id="portfolio" className="text-center">
        <div className="container">
          <div className="section-title">
            <h2>Wicked Problem</h2>
            <p>Motivation is a wicked problem in remote team collaboration</p>
          </div>
          <div className="row">
            <div className="portfolio-items">
              {map(v => {
                return (
                  <div className="col-sm-6 col-md-4 col-lg-4">
                    <div className="portfolio-item">
                      <div className="hover-bg">
                        {" "}
                        <a
                          href={`https://id-2e.com/${v.key}/`}
                          title={v.title}
                          target="_blank"
                        >
                          <div className="hover-text">
                            <h4>{v.title}</h4>
                          </div>
                          <img
                            src={`img/portfolio/${v.key}.png`}
                            className="img-responsive"
                            alt={v.title}
                          />{" "}
                        </a>{" "}
                      </div>
                    </div>
                  </div>
                )
              })([
                { key: "collaboration", title: "Collaboration" },
                { key: "loneliness", title: "Loneliness" },
                {
                  key: "collaboration-tools",
                  title: "Collaboration Tools"
                },
                { key: "distractions", title: "Distractions" },
                { key: "unplugging", title: "Unplugging" },
                { key: "timezones", title: "Timezones" }
              ])}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Gallery
