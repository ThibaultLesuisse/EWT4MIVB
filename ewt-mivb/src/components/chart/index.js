import React from 'react';
import { Line } from 'react-chartjs-2'; 

class Chart extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {};
      }
    componentDidMount(){
        fetch('http://localhost:3001/ewt')
        .then(response  => response.json())
        .then(ewt => {
            this.setState({ewt})
            console.log(ewt)
        })
        .catch(err => console.log(err))
    }
    
  render() {
    const data = {
        labels: this.state,
        datasets: [
          {
            label: 'EWT for line 39',
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
            data: this.state
          }
        ]
      };
      
    return (
      <Line data={data}
    width={400}
    height={400}
    options={{ maintainAspectRatio: false }} />
    );
  }
}


export default Chart;