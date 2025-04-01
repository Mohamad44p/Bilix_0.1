// Type definitions for ApexCharts
declare module 'apexcharts' {
  export interface ApexOptions {
    chart?: any;
    colors?: any;
    dataLabels?: any;
    fill?: any;
    grid?: any;
    labels?: any;
    legend?: any;
    markers?: any;
    plotOptions?: any;
    responsive?: any;
    series?: any;
    states?: any;
    stroke?: any;
    subtitle?: any;
    theme?: any;
    title?: any;
    tooltip?: any;
    xaxis?: any;
    yaxis?: any;
  }

  export default class ApexCharts {
    constructor(element: HTMLElement | null, options: ApexOptions);
    render(): Promise<void>;
    updateOptions(options: ApexOptions, redrawPaths?: boolean, animate?: boolean): Promise<void>;
    updateSeries(newSeries: any, animate?: boolean): Promise<void>;
    toggleSeries(seriesName: string): void;
    destroy(): void;
  }
}

// Type definitions for react-apexcharts
declare module 'react-apexcharts' {
  import { Component } from 'react';
  import { ApexOptions } from 'apexcharts';
  
  interface ReactApexChartsProps {
    type?: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'candlestick' | 'radar' | 'polarArea';
    series: any;
    width?: string | number;
    height?: string | number;
    options?: ApexOptions;
    [key: string]: any;
  }
  
  declare class ReactApexChart extends Component<ReactApexChartsProps> {}
  
  export default ReactApexChart;
} 