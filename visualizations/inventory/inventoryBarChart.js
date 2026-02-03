import * as d3 from "d3";

export function renderInventoryChart({ element, data }) {
  const width = 800;
  const height = 400;
  const margin = { top: 30, right: 20, bottom: 60, left: 60 };

  d3.select(element).selectAll("*").remove();

  const svg = d3.select(element)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleBand()
    .domain(data.map(d => d.partName))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.quantity)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", d => x(d.partName))
    .attr("y", d => y(d.quantity))
    .attr("height", d => y(0) - y(d.quantity))
    .attr("width", x.bandwidth())
    .attr("fill", d => d.quantity < 5 ? "#e74c3c" : "#3498db");

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));
}
