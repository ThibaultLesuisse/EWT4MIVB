import React from 'react';
import {
  Line
} from 'react-chartjs-2';

class Chart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {chart_ready: false};
    this.compare_data.bind(this)
  }
  compare_data(a, b) {
    if (new Date(a.date + " ,2019") > new Date(b.date + " ,2019")) {
      return 1
    } else {
      return -1
    }
  }
  componentDidMount() {
    fetch('http://174.138.107.45/delay')
      .then(response => response.json())
      .then(delay => {
        let _data_delay = [];
        let _labels = [];
        delay.sort(this.compare_data);
        delay.forEach(element => {
          this.setState({
            labels: _labels,
          });
          _data_delay.push(element.delay/2)
          _labels.push(element.date)
        });
        
        fetch('http://174.138.107.45/ewt')
          .then(response => response.json())
          .then(ewt => {
            let _data = [];
            delay.forEach( () => {
              _data.push((ewt.ewt/2))
            });
            let final_excess = _data_delay.map(a => {
              return  (_data[0]) - (parseFloat(a)/2)
            })
            let final_data_delay = _data_delay.map(a => {
              return (parseFloat(a)/2) + (_data[0])
            })
            this.setState({
              ewt: _data,
              data: final_data_delay,
              chart_ready: true,
              excess: final_excess
            })
          })
          .catch(err => console.log(err))
      })
      .catch(err => console.log(err))

  }

  render() {
    const data = {
      labels: this.state.labels,
      datasets: [{
          label: 'Average Waiting Time line 39',
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
          data: this.state.data
        },
        {
          label: 'Scheduled Waiting Time for line 39',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
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
          data: this.state.ewt
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
          data: this.state.excess
        }
      ]
    };
    if(this.state.chart_ready) {return <div width = {500} ><Line data = {data} width = {400} height = {400} options = { {maintainAspectRatio: false }}/>
  </div >}
  else     return ( <div width = {500}>
          Chart is Loading
    </div >
    );
  }
}


export default Chart;