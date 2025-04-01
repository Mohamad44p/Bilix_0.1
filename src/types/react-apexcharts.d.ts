declare module 'react-apexcharts' {
  import { Component } from 'react';
  
  interface ApexChartProps {
    type?: string;
    series: any;
    width?: string | number;
    height?: string | number;
    options?: any;
    [key: string]: any;
  }
  
  class ApexCharts extends Component<ApexChartProps> {}
  
  export default ApexCharts;
} 