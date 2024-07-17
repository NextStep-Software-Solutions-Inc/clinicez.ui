"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

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

import { DateRange } from "react-day-picker"
import { format, isBefore } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover"
import { Button } from "@components/ui/button"
import { cn } from "@lib/utils"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@components/ui/calendar"
import dayjs from "dayjs"

const chartConfig = {
  request: {
    label: "Request",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig


interface DailyMembershipRequestChartProps {
    chartData: {
        date: string;
        request: number;
    }[];
    onChangeDate?: (date: DateRange) => void;
    dateRange?: DateRange;
}
export function DailyMembershipRequestChart({ chartData, onChangeDate, dateRange }: DailyMembershipRequestChartProps) {

  const [date, setDate] = React.useState<DateRange | undefined>(dateRange)

  const filteredData = React.useMemo(() => chartData.filter((item) => {
    const itemDate = new Date(item.date)
    if(!date?.from || !date?.to) return true
    return isBefore(itemDate, date.to) && isBefore(date.from, itemDate)
  }), [chartData, date])


  const handleDateChange = (date: DateRange | undefined) => {
    setDate(date)
    if(date) onChangeDate?.(date)
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Daily Membership Request</CardTitle>
          <CardDescription>
            Showing the number of membership requests per day.
          </CardDescription>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleDateChange}
              numberOfMonths={2}
              disabled={{
                after: new Date(),
                before: dayjs().startOf("year").toDate(),
              }}
            />
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={filteredData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="request"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "Asia/Manila"
                    })
                  }}
                />
              }
            />
            <Bar dataKey="request" fill={`var(--color-request)`} radius={4} >
              <LabelList
                dataKey="request"
                position="insideTop"
                offset={8}
                className="fill-primary-foreground truncate"
                fontSize={10}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
