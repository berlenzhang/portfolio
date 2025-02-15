let dataArray = [], commitList = [], brushArea = null;

const chartWidth = 800, chartHeight = 500;
const padding = { top: 20, right: 30, bottom: 50, left: 50 };

let xScaleAxis, yScaleAxis, radiusScale;

const fetchData = async () => {
    dataArray = await d3.csv("loc.csv", row => ({
        ...row,
        line: +row.line,
        depth: +row.depth,
        length: +row.length,
        date: new Date(row.date + "T00:00" + row.timezone),
        datetime: new Date(row.datetime)
    }));
    processCommitsData();
    renderStatistics();
    showBranchesAndWorkTime();
    renderChart();
};

const processCommitsData = () => {
    commitList = d3.groups(dataArray, d => d.commit).map(([key, group]) => {
        const { author, date, time, timezone, datetime } = group[0];
        return {
            id: key,
            url: `https://github.com/YOUR_REPO/commit/${key}`,
            author,
            date,
            time,
            timezone,
            datetime,
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            totalLines: group.length,
            lines: group
        };
    });
};

const showBranchesAndWorkTime = () => {
    const branchesCount = 3;
    const avgWorkTime = "5h 30m";
    d3.select("#branch-count").text(branchesCount);
    d3.select("#avg-time").text(avgWorkTime);
};

const renderStatistics = () => {
    d3.select("#total-commits").text(commitList.length);
    d3.select("#total-files").text(d3.group(dataArray, d => d.file).size);
    d3.select("#total-loc").text(dataArray.length);
    d3.select("#max-depth").text(d3.max(dataArray, d => d.depth));
    d3.select("#longest-line").text(d3.max(dataArray, d => d.length));
    d3.select("#max-lines").text(d3.max(dataArray, d => d.line));
};

const renderChart = () => {
    if (!commitList.length) return;

    const svgContainer = d3.select("#chart").append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .style("overflow", "visible");

    const chartArea = {
        top: padding.top,
        right: chartWidth - padding.right,
        bottom: chartHeight - padding.bottom,
        left: padding.left,
        width: chartWidth - padding.left - padding.right,
        height: chartHeight - padding.top - padding.bottom
    };

    xScaleAxis = d3.scaleTime()
        .domain(d3.extent(commitList, d => d.datetime))
        .range([chartArea.left, chartArea.right])
        .nice();

    yScaleAxis = d3.scaleLinear()
        .domain([0, 24])
        .range([chartArea.bottom, chartArea.top]);

    const [minLine, maxLine] = d3.extent(commitList, d => d.totalLines);
    radiusScale = d3.scaleSqrt()
        .domain([minLine, maxLine])
        .range([3, 20]);

    const colorPalette = d3.scaleOrdinal(d3.schemeCategory10);
    const circleColors = commitList.map(() => colorPalette(Math.random()));

    svgContainer.append("g")
        .attr("class", "gridlines")
        .attr("transform", `translate(${chartArea.left}, 0)`)
        .call(d3.axisLeft(yScaleAxis).tickSize(-chartArea.width).tickFormat(""));

    svgContainer.append("g")
        .attr("transform", `translate(0,${chartArea.bottom})`)
        .call(d3.axisBottom(xScaleAxis).tickFormat(d3.timeFormat("%b %d")));

    svgContainer.append("g")
        .attr("transform", `translate(${chartArea.left},0)`)
        .call(d3.axisLeft(yScaleAxis).tickFormat(d => `${d % 24}:00`));

    const dotGroup = svgContainer.append("g")
        .attr("class", "dots")
        .selectAll("circle")
        .data(commitList.sort((a, b) => d3.descending(a.totalLines, b.totalLines)))
        .join("circle")
        .attr("cx", d => xScaleAxis(d.datetime))
        .attr("cy", d => yScaleAxis(d.hourFrac))
        .attr("r", d => radiusScale(d.totalLines))
        .attr("fill", (d, i) => circleColors[i])
        .attr("opacity", 0.7)
        .on("mouseover", (evt, d) => {
            d3.select(evt.currentTarget)
                .style("stroke", "black")
                .style("stroke-width", 2)
                .style("fill-opacity", 1);
            updateTooltip(d);
            toggleTooltip(true);
            positionTooltip(evt);
        })
        .on("mouseout", evt => {
            d3.select(evt.currentTarget)
                .style("stroke", "none")
                .style("fill-opacity", 0.7);
            updateTooltip(null);
            toggleTooltip(false);
        });

    const brush = d3.brush()
        .extent([[chartArea.left, chartArea.top], [chartArea.right, chartArea.bottom]])
        .on("start brush end", brushed);

    svgContainer.append("g").attr("class", "brush").call(brush);

    svgContainer.select(".dots").raise();
};

const brushed = evt => {
    brushArea = evt.selection;
    highlightSelection();
    showSelectionCount();
    updateLangBreakdown();
};

const isSelectedCommit = commit => {
    if (!brushArea) return false;

    const [x0, y0] = brushArea[0], [x1, y1] = brushArea[1];
    const x = xScaleAxis(commit.datetime), y = yScaleAxis(commit.hourFrac);

    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
};

const highlightSelection = () => {
    d3.selectAll("circle").classed("selected", d => isSelectedCommit(d));
};

const updateTooltip = commit => {
    const tooltip = document.getElementById("commit-tooltip");
    if (!commit) {
        tooltip.hidden = true;
        return;
    }
    tooltip.hidden = false;
    tooltip.querySelector("#commit-link").href = commit.url;
    tooltip.querySelector("#commit-date").textContent = commit.datetime.toLocaleDateString();
    tooltip.querySelector("#commit-time").textContent = commit.time;
    tooltip.querySelector("#commit-author").textContent = commit.author;
    tooltip.querySelector("#commit-lines").textContent = commit.totalLines;
};

const toggleTooltip = visible => {
    document.getElementById("commit-tooltip").hidden = !visible;
};

const positionTooltip = evt => {
    const tooltip = document.getElementById("commit-tooltip");
    tooltip.style.left = `${evt.clientX}px`;
    tooltip.style.top = `${evt.clientY}px`;
};

const updateLangBreakdown = () => {
    const selectedCommits = brushArea ? commitList.filter(isSelectedCommit) : [];
    const container = document.getElementById("language-breakdown");
    container.innerHTML = "";

    if (!selectedCommits.length) {
        container.innerHTML = "<p>No commits selected</p>";
        return;
    }

    const lines = selectedCommits.flatMap(d => d.lines);
    const breakdown = d3.rollup(lines, v => v.length, d => d.type);
    const sortedBreakdown = Array.from(breakdown).sort((a, b) => b[1] - a[1]);
    const totalLines = d3.sum(sortedBreakdown, d => d[1]);

    container.innerHTML = `
        <p class="commit-count">${selectedCommits.length} commits selected</p>
        <div class="language-grid">
            ${sortedBreakdown
                .map(([language, count]) => `
                    <div class="language-item">
                        <p class="lang-name">${language.toUpperCase()}</p>
                        <p class="lang-lines">${count} lines</p>
                        <p class="lang-percent">(${((count / totalLines) * 100).toFixed(1)}%)</p>
                    </div>
                `)
                .join("")}
        </div>
    `;
};


const showSelectionCount = () => {
    const selected = brushArea ? commitList.filter(isSelectedCommit) : [];
    d3.select("#selection-count").text(`${selected.length || "No"} commits selected`);
};

document.addEventListener("DOMContentLoaded", fetchData);
