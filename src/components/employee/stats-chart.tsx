
"use client"

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { ActivityData } from "@/lib/types";
import { format } from "date-fns";

interface EmployeeStatsProps {
    salary?: number;
    activityData: ActivityData[];
}

export function EmployeeStats({ salary, activityData }: EmployeeStatsProps) {
    const activityChartConfig = {
      tasks: {
        label: "Tasks",
        color: "hsl(var(--chart-1))",
      },
      meetings: {
        label: "Meetings",
        color: "hsl(var(--chart-2))",
      },
    }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Current Monthly Salary</CardTitle>
                <CardDescription>Your salary for the current month.</CardDescription>
            </CardHeader>
            <CardContent>
                {salary !== undefined ? (
                    <div>
                        <div className="text-4xl font-bold">
                            ₹{salary.toLocaleString()}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            For {format(new Date(), "MMMM yyyy")}
                        </p>
                    </div>
                ) : (
                    <p className="text-muted-foreground">Salary data not available.</p>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
                <CardDescription>Tasks completed and meetings attended this week.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={activityChartConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={activityData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar
                      dataKey="tasks"
                      fill="var(--color-tasks)"
                      radius={4}
                    />
                    <Bar
                      dataKey="meetings"
                      fill="var(--color-meetings)"
                      radius={4}
                    />
                  </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  )
}
