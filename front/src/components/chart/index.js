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
  //174.138.107.45
  async componentDidMount() {
    try {
      let delay_response = await fetch('http://174.138.107.45/delay');
      let delay = await  delay_response.json();
      let swt_response = await fetch('http://174.138.107.45/ewt');
      let swt_parsed = await swt_response.json();
      let _data = [];
      delay.sort(this.compare_data);    
      delay.forEach( (_delay) => {
              switch (new Date(_delay.date + ", 2019").getDay()) {
                case 0:
                      _data.push({
                        day: _delay.date,
                        swt: (swt_parsed.ewt_saturdays)/2,
                        delay: _delay.delay
                      })
                    break;
                case 6: 
                      _data.push({
                        day: _delay.date,
                        swt: (swt_parsed.ewt_sundays)/2,
                        delay: _delay.delay
                      })
                  break;
                default:
                      _data.push({
                        day: _delay.date,
                        swt: (swt_parsed.ewt_weekdays)/2,
                        delay: _delay.delay
                      })
                    break;
                }
              });
      let days = _data.map( a => a.day)
      let swt = _data.map( a => a.swt)
      let awt = _data.map( a => { return a.swt + parseFloat(a.delay)});
      let ewt = _data.map( a => parseFloat(a.delay))
      this.setState({
                swt : swt,
                awt : awt,
                ewt: ewt,
                days: days,
                chart_ready: true
      })
      console.log(JSON.stringify(this.state, null, 2))
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    const data = {
      labels: this.state.days,
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
          data: this.state.awt
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
          data: this.state.swt
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
          data: this.state.ewt
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
