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
    fetch('http://localhost:3001/delay')
      .then(response => response.json())
      .then(delay => {
        let _data_delay = [];
        let _labels = [];
        delay.sort(this.compare_data);
        delay.forEach(element => {
          _data_delay.push(element.delay/2)
          _labels.push(element.date)
        });
        this.setState({
          labels: _labels,
        });
        fetch('http://localhost:3001/ewt')
          .then(response => response.json())
          .then(ewt => {
            let _data = [];
            delay.forEach( () => {
              _data.push((ewt.ewt/2))
            });
            let final_data_delay = _data_delay.map(a => {
              console.log(`a is : ${typeof a} ewt is: ${typeof _data[0]}`)
              return parseFloat(a) + (_data[0])
            })
            this.setState({
              ewt: _data,
              data: final_data_delay,
              chart_ready: true
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
          label: 'Estimated Waiting Time line 39',
          fill: false,
          lineTension: 0.1,
          backgroundColor: 'rgba(214, 69, 65, 0.4)',
          borderColor: 'rgba(214, 69, 65, 1)',
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
          label: 'Average Waiting Time for line 39',
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
        }
      ]
    };
    if(this.state.chart_ready) {return <div width = {500} marginWidth={"25%"} ><Line data = {data} width = {400} height = {400} options = { {maintainAspectRatio: false , scales: {
      yAxes: [{
          ticks: {
              beginAtZero: true
          }
      }]
  }}}/>
  </div >}
  else     return ( <div width = {500}>
          Chart is Loading
    </div >
    );
  }
}


export default Chart;