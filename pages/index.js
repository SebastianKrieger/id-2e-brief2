import { useEffect, Fragment } from "react"
import Conf from "nd/core/Conf"
import { bind, Tracker } from "nd"
import React, { Component } from "react"
import Navigation from "../components/navigation"
import Header from "../components/header"
import Features from "../components/features"
import About from "../components/about"
import Services from "../components/services"
import Gallery from "../components/gallery"
import Testimonials from "../components/testimonials"
import Team from "../components/Team"
import Contact from "../components/contact"
import data from "../lib/data"
/*
export class App extends Component {
  state = {
    resumeData : {},
  }
  getResumeData(){
    $.ajax({
      url:'/data.json',
      dataType:'json',
      cache: false,
      success: function(data){
        this.setState({resumeData: data});
      }.bind(this),
      error: function(xhr, status, err){
        console.log(err);
        alert(err);
      }
    });
  }

  componentDidMount(){
    this.getResumeData();
  }

  render() {
    return (
    <div>
        <Navigation />
        <Header data={this.state.resumeData.Header}/>
        <Features data={this.state.resumeData.Features}/>
        <About  data={this.state.resumeData.About}/>
        <Services  data={this.state.resumeData.Services}/>
        <Gallery />
        <Testimonials  data={this.state.resumeData.Testimonials}/>
        <Team  data={this.state.resumeData.Team}/>
        <Contact  data={this.state.resumeData.Contact}/>
      </div>
    )
  }
}
*/

export default bind(({ set, init, router }) => {
  const fn = init()
  console.log(data)
  return (
    <div>
      <Navigation />
      <Header data={data.Header} />
      <Features data={data.Features} />
      <About data={data.About} />
      <Services data={data.Services} />
      <Gallery />
      <Testimonials data={data.Testimonials} />
      <Team data={data.Team} />
      <Contact data={data.Contact} />
    </div>
  )
}, [])
