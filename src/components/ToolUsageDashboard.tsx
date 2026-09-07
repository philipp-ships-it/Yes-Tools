import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3 } from 'lucide-react';

export const ToolUsageDashboard: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [data, setData] = useState<{tool: string, count: number}[]>([]);

    useEffect(() => {
        try {
            const usage = JSON.parse(localStorage.getItem('tool-usage') || '{}');
            const formatted = Object.entries(usage)
                .map(([tool, count]) => ({ tool, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // top 5
            setData(formatted);
        } catch (e) {
            console.error(e);
        }
    }, []);

    useEffect(() => {
        if (!svgRef.current || !containerRef.current || data.length === 0) return;

        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const width = containerRef.current.clientWidth - margin.left - margin.right;
        const height = 250 - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const chart = svg
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand()
            .domain(data.map(d => d.tool))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 10])
            .nice()
            .range([height, 0]);

        // Add bars
        chart.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.tool) || 0)
            .attr('y', height)
            .attr('width', x.bandwidth())
            .attr('height', 0)
            .attr('fill', 'url(#bar-gradient)')
            .attr('rx', 4)
            .transition()
            .duration(800)
            .attr('y', d => y(d.count))
            .attr('height', d => height - y(d.count));

        // Define gradient
        const defs = svg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'bar-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        
        gradient.append('stop').attr('offset', '0%').attr('stop-color', '#4F46E5');
        gradient.append('stop').attr('offset', '100%').attr('stop-color', '#7C3AED');

        // Add X axis
        chart.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)')
            .style('fill', '#888')
            .style('font-family', 'sans-serif')
            .style('font-size', '11px');

        // Add Y axis
        chart.append('g')
            .call(d3.axisLeft(y).ticks(5))
            .selectAll('text')
            .style('fill', '#888')
            .style('font-family', 'sans-serif')
            .style('font-size', '11px');

        // Clean up axis lines
        chart.selectAll('.domain, .tick line')
            .style('stroke', '#e5e7eb');

    }, [data]);

    if (data.length === 0) return null;

    return (
        <div className="bg-tg-light-surface dark:bg-tg-dark-surface border border-tg-light-border dark:border-tg-dark-border rounded-2xl p-4 md:p-6 shadow-sm w-full">
            <div className="flex items-center gap-2 mb-4 text-tg-light-text dark:text-tg-dark-text">
                <BarChart3 size={18} className="text-indigo-500" />
                <h3 className="font-semibold">Your Tool Usage</h3>
            </div>
            <div ref={containerRef} className="w-full flex justify-center">
                <svg ref={svgRef}></svg>
            </div>
        </div>
    );
};
