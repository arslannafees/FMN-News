import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { OHLCData } from '../services/newsService';

interface CandlestickChartProps {
    data: OHLCData[];
    colors?: {
        backgroundColor?: string;
        textColor?: string;
        upColor?: string;
        downColor?: string;
        gridColor?: string;
    };
}

export function CandlestickChart({ data, colors }: CandlestickChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    const defaultColors = {
        backgroundColor: 'transparent',
        textColor: '#9CA3AF',
        upColor: '#22c55e', // Green
        downColor: '#ef4444', // Red
        gridColor: '#374151',
        ...colors
    };

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth
                });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: defaultColors.backgroundColor },
                textColor: defaultColors.textColor,
            },
            grid: {
                vertLines: { color: defaultColors.gridColor, style: 4 }, // 4 is dotted
                horzLines: { color: defaultColors.gridColor, style: 4 },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            crosshair: {
                mode: 0, // Normal crosshair
            },
            timeScale: {
                borderColor: defaultColors.gridColor,
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: defaultColors.gridColor,
            },
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: defaultColors.upColor,
            downColor: defaultColors.downColor,
            borderVisible: false,
            wickUpColor: defaultColors.upColor,
            wickDownColor: defaultColors.downColor,
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [defaultColors.backgroundColor, defaultColors.downColor, defaultColors.gridColor, defaultColors.textColor, defaultColors.upColor]); // Re-init chart when colors change

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            // Sort data by time ascending required by lightweight-charts
            const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            seriesRef.current.setData(sortedData);

            // Auto scale
            if (chartRef.current) {
                chartRef.current.timeScale().fitContent();
            }
        }
    }, [data]);

    return (
        <div ref={chartContainerRef} className="w-full h-[400px] overflow-hidden rounded-xl" />
    );
}
