import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';

export interface LineData {
    time: string;
    value: number;
}

interface LineChartProps {
    data: LineData[];
    colors?: {
        backgroundColor?: string;
        textColor?: string;
        lineColor?: string;
        gridColor?: string;
    };
}

export function LineChart({ data, colors }: LineChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

    const defaultColors = {
        backgroundColor: 'transparent',
        textColor: '#9CA3AF',
        lineColor: '#3b82f6',
        gridColor: '#374151',
        ...colors,
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: defaultColors.backgroundColor },
                textColor: defaultColors.textColor,
            },
            grid: {
                vertLines: { color: defaultColors.gridColor, style: 4 },
                horzLines: { color: defaultColors.gridColor, style: 4 },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            crosshair: { mode: 0 },
            timeScale: {
                borderColor: defaultColors.gridColor,
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: { borderColor: defaultColors.gridColor },
        });

        const lineSeries = chart.addSeries(LineSeries, {
            color: defaultColors.lineColor,
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: true,
        });

        chartRef.current = chart;
        seriesRef.current = lineSeries;

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [defaultColors.backgroundColor, defaultColors.gridColor, defaultColors.lineColor, defaultColors.textColor]);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            const sorted = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            // Deduplicate: lightweight-charts requires strictly ascending time with no duplicates
            const deduped = sorted.filter((d, i, arr) => i === 0 || d.time !== arr[i - 1].time);
            seriesRef.current.setData(deduped);
            chartRef.current?.timeScale().fitContent();
        }
    }, [data]);

    return <div ref={chartContainerRef} className="w-full h-[400px] overflow-hidden rounded-xl" />;
}
