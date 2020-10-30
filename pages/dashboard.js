import { useEffect, Fragment } from "react"
import moment from "moment"
import { bind, Tracker } from "nd"
import {
  forEach,
  uniq,
  pluck,
  sortBy,
  prop,
  map,
  values,
  mapObjIndexed,
  compose,
  groupBy,
  indexBy,
  isNil,
} from "ramda"
import { Box, Flex } from "rebass"
import Navigation from "../components/navigation_dashboard"
import Contact from "../components/contact"
import data from "../lib/data"
import { ResponsiveLine } from "@nivo/line"
import { ResponsiveBar } from "@nivo/bar"

const MyResponsiveLine = ({ data }) => (
  <ResponsiveLine
    data={data}
    margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
    xScale={{
      type: "time",
      format: "%Y-%m-%d",
    }}
    xFormat="time:%Y-%m-%d"
    yScale={{
      type: "linear",
      min: "auto",
      max: "auto",
      stacked: false,
      reverse: false,
    }}
    axisTop={null}
    axisRight={null}
    axisLeft={{
      orient: "left",
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: "Motivation Level",
      legendOffset: -40,
      legendPosition: "middle",
      tickValues: [1, 2, 3, 4, 5],
    }}
    axisBottom={{
      format: "%b %d",
      legend: "Date",
      legendPosition: "middle",
      legendOffset: 40,
    }}
    curve="natural"
    colors={{ scheme: "category10" }}
    pointSize={10}
    lineWidth={3}
    pointColor={{ theme: "background" }}
    pointBorderWidth={2}
    pointBorderColor={{ from: "serieColor" }}
    pointLabel="y"
    pointLabelYOffset={-12}
    useMesh={true}
    legends={[
      {
        anchor: "bottom-right",
        direction: "column",
        justify: false,
        translateX: 100,
        translateY: 0,
        itemsSpacing: 0,
        itemDirection: "left-to-right",
        itemWidth: 80,
        itemHeight: 20,
        itemOpacity: 0.75,
        symbolSize: 12,
        symbolShape: "circle",
        symbolBorderColor: "rgba(0, 0, 0, .5)",
        effects: [
          {
            on: "hover",
            style: {
              itemBackground: "rgba(0, 0, 0, .03)",
              itemOpacity: 1,
            },
          },
        ],
      },
    ]}
  />
)
const MyResponsiveBar = ({ data, users }) => (
  <ResponsiveBar
    data={data}
    keys={users}
    indexBy="challenge"
    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
    padding={0.3}
    colors={{ scheme: "nivo" }}
    defs={[
      {
        id: "dots",
        type: "patternDots",
        background: "inherit",
        color: "#38bcb2",
        size: 4,
        padding: 1,
        stagger: true,
      },
      {
        id: "lines",
        type: "patternLines",
        background: "inherit",
        color: "#eed312",
        rotation: -45,
        lineWidth: 6,
        spacing: 10,
      },
    ]}
    fill={[
      {
        match: {
          id: "fries",
        },
        id: "dots",
      },
      {
        match: {
          id: "sandwich",
        },
        id: "lines",
      },
    ]}
    borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: "Chalenge",
      legendPosition: "middle",
      legendOffset: 40,
    }}
    yScale={{
      type: "linear",
      min: "auto",
      max: "auto",
      stacked: false,
      reverse: false,
    }}
    axisTop={null}
    axisRight={null}
    axisLeft={{
      orient: "left",
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: "Occurrence",
      legendOffset: -40,
      legendPosition: "middle",
    }}
    labelSkipWidth={12}
    labelSkipHeight={12}
    labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
    legends={[
      {
        dataFrom: "keys",
        anchor: "bottom-right",
        direction: "column",
        justify: false,
        translateX: 120,
        translateY: 0,
        itemsSpacing: 2,
        itemWidth: 100,
        itemHeight: 20,
        itemDirection: "left-to-right",
        itemOpacity: 0.85,
        symbolSize: 20,
        effects: [
          {
            on: "hover",
            style: {
              itemOpacity: 1,
            },
          },
        ],
      },
    ]}
    animate={true}
    motionStiffness={90}
    motionDamping={15}
  />
)

export default bind(
  ({ set, init, router, $ }) => {
    const fn = init(["initFB", "getData"])
    useEffect(() => {
      fn.initFB()
    })
    const user_map = indexBy(prop("user_id"))($.users || [])
    const moods = isNil($.moods)
      ? []
      : compose(
          values,
          mapObjIndexed((v, k) => {
            return {
              id: user_map[k].user_name,
              data: compose(
                map(v2 => ({
                  x: moment(v2.date).format("YYYY-MM-DD"),
                  y: v2.value,
                })),
                sortBy(prop("date"))
              )(v),
            }
          }),
          groupBy(prop("user_id"))
        )($.moods)

    const challenges = isNil($.challenges)
      ? []
      : compose(
          values,
          mapObjIndexed((v, k) => {
            let obj = { challenge: v[0].text }
            compose(
              forEach(v => {
                obj[v.name] = v.length
              }),
              values,
              mapObjIndexed((v, k) => {
                return { name: user_map[k].user_name, length: v.length }
              }),
              groupBy(prop("user_id"))
            )(v)
            return obj
          }),
          groupBy(prop("value"))
        )($.challenges)
    const challenge_users = compose(
      map(v => user_map[v].user_name),
      uniq,
      pluck("user_id")
    )($.challenges)

    return (
      <Fragment>
        <Navigation />
        {isNil($.users) || $.moods.length === 0 || $.challenges.length === 0 ? (
          <Flex
            pt="80px"
            width={1}
            height="400px"
            fontSize="30px"
            justifyContent="center"
            alignItems="center"
          >
            <Box as="i" className="fa fa-sync fa-spin" mr={3} />
            loading...
          </Flex>
        ) : (
          <Fragment>
            <Box
              id="motivation"
              pt="120px"
              px="50px"
              fontSize="20px"
              fontWeight="bold"
            >
              Team Motivation
            </Box>
            <Box px="30px" height="300px" width={1}>
              <MyResponsiveLine data={moods} />
            </Box>
            <Box
              id="challenges"
              pt="100px"
              px="50px"
              fontSize="20px"
              fontWeight="bold"
            >
              Team Challenges
            </Box>
            <Box px="30px" height="300px" width={1} mb="70px">
              <MyResponsiveBar data={challenges} users={challenge_users} />
            </Box>
          </Fragment>
        )}
        <Contact data={data.Contact} />
        <Tracker
          watch={["isFB"]}
          func={({ props: { isFB } }) => {
            if (isFB) fn.getData()
          }}
        />
      </Fragment>
    )
  },
  ["users", "moods", "challenges"]
)
