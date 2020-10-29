import "normalize.css"
import { _app } from "nd"
export default _app({
  fonts: ["Open+Sans:300,400,600,700", "Lato:400,700", "PT+Sans&display=swap"],
  links: [
    { href: "css/bootstrap.css", rel: "stylesheet", type: "text/css" },
    {
      href: "fonts/font-awesome/css/font-awesome.css",
      rel: "stylesheet",
      type: "text/css",
    },
    { href: "css/style.css", rel: "stylesheet", type: "text/css" },
    {
      href: "css/nivo-lightbox/nivo-lightbox.css",
      rel: "stylesheet",
      type: "text/css",
    },
    {
      href: "css/nivo-lightbox/default.css",
      rel: "stylesheet",
      type: "text/css",
    },
  ],
  scripts: [
    { src: "js/jquery.1.11.1.js" },
    { src: "js/bootstrap.js" },
    { src: "js/SmoothScroll.js" },
    { src: "js/nivo-lightbox.js" },
    { src: "js/jqBootstrapValidation.js" },
    { src: "js/contact_me.js" },
    { src: "js/main.js" },
  ],
})
