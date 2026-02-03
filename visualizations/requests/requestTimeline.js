import * as d3 from "d3";

export function renderRequestTimeline({ element, data }) {
  const width = 800;
  const height = 200;
  const margin = { left: 60, right: 40 };

  d3.select(element).selectAll("*").remove();

  const svg = d3.select(element)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.createdAt)))
    .range([margin.left, width - margin.right]);

  svg.append("g")
    .attr("transform", `translate(0, ${height / 2})`)
    .call(d3.axisBottom(x));

  svg.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(new Date(d.createdAt)))
    .attr("cy", height / 2)
    .attr("r", 8)
    .attr("fill", d => {
      if (d.status === "FULFILLED") return "#2ecc71";
      if (d.status === "APPROVED") return "#f1c40f";
      return "#e74c3c";
    });
}
