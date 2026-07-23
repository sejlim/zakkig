"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const ChartInner = dynamic(
  () =>
    import("recharts").then((mod) => {
      const { Area, AreaChart, CartesianGrid, XAxis, YAxis } = mod;
      return function ChartInnerComponent({
        chartData,
        xAxisTicks,
        width,
        height,
      }: {
        chartData: any[];
        xAxisTicks: string[];
        width?: number;
        height?: number;
      }) {
        const w = width && width > 0 ? width : 320;
        const h = height && height > 0 ? height : 340;

        return (
          <AreaChart
            width={w}
            height={h}
            data={chartData}
            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              ticks={xAxisTicks}
              tick={{ fontSize: 12, fill: "currentColor", opacity: 0.5 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={20}
              tick={{ fontSize: 12, fill: "currentColor", opacity: 0.5 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              dataKey="orders"
              type="monotone"
              fill="url(#fillOrders)"
              fillOpacity={0.4}
              stroke="var(--color-orders)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        );
      };
    }),
  { ssr: false },
);

export default function OverviewChart({
  chartData,
  chartConfig,
  xAxisTicks,
}: {
  chartData: any[];
  chartConfig: any;
  xAxisTicks: string[];
}) {
  return (
    <ChartContainer config={chartConfig} className="h-[340px] w-full mt-4">
      <ChartInner chartData={chartData} xAxisTicks={xAxisTicks} />
    </ChartContainer>
  );
}
