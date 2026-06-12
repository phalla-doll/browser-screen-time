import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts"

// A tiny 7-day trend chart for KPI cards. No axes or tooltips — just bars, with
// the most recent (today) bar at full opacity and prior days dimmed.
export function Sparkline({
  data,
  color = "#6366f1",
}: {
  data: number[]
  color?: string
}) {
  const chart = data.map((value, i) => ({ i, value }))

  return (
    <div className="h-10 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart} barCategoryGap={2}>
          <Bar dataKey="value" radius={2} isAnimationActive={false}>
            {chart.map((d) => (
              <Cell
                key={d.i}
                fill={color}
                fillOpacity={d.i === chart.length - 1 ? 1 : 0.25}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
