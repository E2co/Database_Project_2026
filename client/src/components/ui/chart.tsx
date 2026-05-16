import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

// Custom type for payload
interface PayloadItem {
  value?: number;
  name?: string;
  payload?: any;
  color?: string;
  [key: string]: any;
}

// Rest of the chart component with proper typing
export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentPropsWithoutRef<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(({ active, payload, className, indicator = "dot", hideLabel = false, hideIndicator = false, label, labelKey, nameKey, ...props }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  const payloadArray = payload as PayloadItem[]
  
  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
      {...props}
    >
      {!hideLabel && (
        <div className="font-medium leading-none">{labelKey ? payloadArray[0]?.[labelKey] : label}</div>
      )}
      <div className="grid gap-1.5">
        {payloadArray.map((item, index) => {
          const indicatorColor = item.color || "currentColor"
          
          return (
            <div key={index} className="flex w-full flex-wrap items-stretch gap-2">
              {!hideIndicator && (
                <div
                  className={cn(
                    "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                    {
                      "h-2.5 w-2.5": indicator === "dot",
                      "w-1": indicator === "line",
                      "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                      "my-0.5": indicator === "line" || indicator === "dashed",
                    }
                  )}
                  style={
                    {
                      "--color-bg": indicatorColor,
                      "--color-border": indicatorColor,
                    } as React.CSSProperties
                  }
                />
              )}
              <div className="flex flex-1 justify-between gap-2 leading-none">
                <div className="grid gap-1.5">
                  <span className="text-muted-foreground">
                    {nameKey ? item[nameKey] : item.name}
                  </span>
                </div>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {item.value?.toLocaleString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

// Export other components as needed
export const ChartContainer = RechartsPrimitive.ResponsiveContainer
export const ChartTooltip = RechartsPrimitive.Tooltip
export const ChartLegend = RechartsPrimitive.Legend