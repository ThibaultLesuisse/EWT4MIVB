import React from 'react';
import {
  Line
} from 'react-chartjs-2';

class Chart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {chart_ready: false, selectedLine: this.props.selectedLine, chartData: null};
    this.compare_data.bind(this)
    this.fetchData = this.fetchData.bind(this);
  }
  compare_data(a, b) {
    if (new Date(a.date + " ,2019") > new Date(b.date + " ,2019")) {
      return 1
    } else {
      return -1
    }
  }
  //localhost
  async fetchData() {
    try {
      let swt_response;
      
      if(!this.props.selectedLine){
          swt_response = await fetch('http://localhost/ewt');
      }else{
        swt_response = await fetch('http://localhost/ewt/'+ this.props.selectedLine);
      }
      let line_overview = await swt_response.json();
      let stops = line_overview.stops.map(stop => stop.stop_name);
      let SWT = line_overview.stops.map(stop => stop.SWT);
      let AWT = line_overview.stops.map(stop => stop.AWT);
      let EWT = line_overview.stops.map(stop => stop.EWT);
      this.setState({chartData: {
        labels: stops,
        datasets: [{
            label: 'Scheduled Waiting Time',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(75,192,192,0.4)',
            borderColor: 'rgba(75,192,192,1)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(214, 69, 65, 1)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(214, 69, 65, 1)',
            pointHoverBorderColor: 'rgba(214, 69, 65, 1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: SWT
          },
          {
            label: 'Actual Waiting Time',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(155, 89, 182,0.4)',
            borderColor: 'rgba(155, 89, 182,1.0)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(214, 69, 65, 1)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(214, 69, 65, 1)',
            pointHoverBorderColor: 'rgba(214, 69, 65, 1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: AWT
          },
          {
            label: 'Excess Waiting Time for line 39',
            fill: false,
            lineTension: 0.1,
            backgroundColor: 'rgba(192, 57, 43,0.4)',
            borderColor: 'rgba(192, 57, 43,1.0)',
            borderCapStyle: 'butt',
            borderDash: [],
            borderDashOffset: 0.0,
            borderJoinStyle: 'miter',
            pointBorderColor: 'rgba(75,192,192,1)',
            pointBackgroundColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: 'rgba(75,192,192,1)',
            pointHoverBorderColor: 'rgba(220,220,220,1)',
            pointHoverBorderWidth: 2,
            pointRadius: 1,
            pointHitRadius: 10,
            data: EWT
          }
        ]}, chart_ready: true})
   
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    this.fetchData();
    if(this.state.chart_ready) {return <div width = {500} ><Line data = {this.state.chartData} width = {400} height = {400} options = { {maintainAspectRatio: false }}/>
  </div >}
  else     return ( <div width = {500}>
          Chart is Loading
    </div >
    );
  }
}


export default Chart;
