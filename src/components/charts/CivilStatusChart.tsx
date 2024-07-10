"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@components/ui/chart"
import { CivilStatus } from "@prisma/client"

const civilStatuses = [...Object.values(CivilStatus), null]
const chartConfig: ChartConfig = civilStatuses.reduce((config: ChartConfig, civilStatus: (typeof civilStatuses)[number], index: number) => {
  config[civilStatus ?? "UNKNOWN"] = {
    label: civilStatus ?? "UNKNOWN",
    color: `hsl(var(--chart-${index+1 % civilStatuses.length}))`, // Cycle through colors if there are more types than colors
  };
  return config;
}, {});

interface CivilStatusChartProps {
  chartData: {
    civilStatus: string
    count: number,
    all: number,
    fill: string
  }[]
}
export function CivilStatusChart({ chartData }: CivilStatusChartProps) {
  const totalCounts = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.all, 0)
  }, [chartData])

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Civil Status Statistics</CardTitle>
        {/* <CardDescription>January - June 2024</CardDescription> */}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <ChartLegend 
              content={<ChartLegendContent />} 
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="civilStatus"
              innerRadius={60}
              strokeWidth={5}
              labelLine={false}
              label={({ payload, ...props }) => {
                return (
                  <text
                    cx={props.cx}
                    cy={props.cy}
                    x={props.x}
                    y={props.y}
                    textAnchor={props.textAnchor}
                    dominantBaseline={props.dominantBaseline}
                    fill="hsla(var(--foreground))"
                  >
                    {payload.count}
                  </text>
                )
              }}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalCounts.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                            Patients
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 0.0% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total count of patients by civil status.
        </div>
      </CardFooter>
    </Card>
  )
}
