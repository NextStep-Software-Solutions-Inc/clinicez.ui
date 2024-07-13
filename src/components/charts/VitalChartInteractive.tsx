"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@components/ui/chart"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@components/ui/select"
import Each from "@components/utils/Each"
import { VitalSignsType } from "../../app/(main)/user/[user]/phr/vitals/RecentVitalSigns"

const chartConfig = {
  views: {
    label: "Value",
  },
  bpSystolic: {
    label: "Systolic Blood Pressure",
    color: "hsl(var(--chart-1))",
  },
  bpDiastolic: {
    label: "Diastolic Blood Pressure",
    color: "hsl(var(--chart-2))",
  },
  temp: {
    label: "Temperature",
    color: "hsl(var(--chart-3))",
  },
  spo2: {
    label: "SpO2",
    color: "hsl(var(--chart-4))",
  },
  pulseRate: {
    label: "Pulse Rate",
    color: "hsl(var(--chart-5))",
  },
  respRate: {
    label: "Respiration Rate",
    color: "hsl(var(--chart-6))",
  },
  height: {
    label: "Height",
    color: "hsl(var(--chart-7))",
  },
  weight: {
    label: "Weight",
    color: "hsl(var(--chart-8))",
  },
  bmi: {
    label: "Body mass index",
    color: "hsl(var(--chart-9))",
  },
} satisfies ChartConfig

interface VitalChartInteractiveProps {
  vitalSigns: VitalSignsType
}

export function VitalChartInteractive({vitalSigns}: VitalChartInteractiveProps) {

  const groupVitalsByDate = (vitals: VitalSignsType) => {
    const data = []
    for (const vital of vitals) {
      const date = new Date(vital.dateTaken).toISOString()
      data.push({
        date,
        temp: vital.temp,
        spo2: vital.spo2,
        pulseRate: vital.pulseRate,
        respRate: vital.respRate,
        height: vital.height,
        weight: vital.weight,
        bmi: vital.bmi,
        bpSystolic: vital.bpSystolic,
        bpDiastolic: vital.bpDiastolic,
      })
    }
    return data
  }
  
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("temp")

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Vitals Chart</CardTitle>
          <CardDescription>
            Select data sets to view in the chart
          </CardDescription>
        </div>
        <div className="flex items-center mx-5 pb-5">
          <Select onValueChange={(chart) => setActiveChart(chart as keyof typeof chartConfig)} value={activeChart}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a field of data" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Data sets</SelectLabel>
                <Each
                  of={["temp", "spo2", "pulseRate", "respRate", "height", "weight", "bmi", "bpSystolic", "bpDiastolic"]}
                  render={(value) => {
                    const chart = value as keyof typeof chartConfig
                    return (
                      <SelectItem value={value}>{chartConfig[chart].label}</SelectItem>
                    )
                  }}
                />
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={groupVitalsByDate(vitalSigns)}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              // hide
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={10}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                  hour: "numeric",
                  minute: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })
                  }}
                />
              }
            />
            <Line
              dataKey={activeChart}
              type="monotone"
              stroke={`var(--color-${activeChart})`}
              strokeWidth={2}
              dot={{
                fill: `var(--color-${activeChart})`,
                r: 2,
              }}
              activeDot={{
                r: 5,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
