import { mergeAll } from "ramda"
let local = {}
let auto = {}

try {
  auto = require("nd/conf.auto.json")
} catch (e) {}

try {
  local = require("nd/conf.local")
} catch (e) {}

const prod = {
  id: "slack-mirror",
  html: {
    title: "SLACK MIRROR | A Motivation Tracking Bot",
    description:
      "Slack Mirror tracks motivation levels and challenges of your team memebers to boost your team productivity in remote collaboration.",
    image:
      "https://raw.githubusercontent.com/SebastianKrieger/id-2e-brief2/main/assets/cover.png",
    "theme-color": "#EFFAD3",
  },
  fb: {
    name: "xxx",
    id: "xxxxxx",
    key: "xxxxxxxxxx",
    sender: "12345678",
    region: "us-central1",
  },
}
module.exports = mergeAll([auto, prod, local])
