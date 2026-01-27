import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface InventorySummary {
  partName: string;
  quantity: number;
}

interface Props {
  data: InventorySummary[];
}

const InventoryBarChart = ({ data }: Props) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || data.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 700;
    const height = 350;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };

    const x = d3
      .scaleBand()
      .domain(data.map(d => d.partName))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, d => d.quantity)!])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.append("g")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.partName)!)
      .attr("y", d => y(d.quantity))
      .attr("height", d => y(0) - y(d.quantity))
      .attr("width", x.bandwidth())
      .attr("fill", "#2563eb");

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-30)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

  }, [data]);

  return <svg ref={ref} width={700} height={350} />;
};

export default InventoryBarChart;
