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

export default () => (
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
