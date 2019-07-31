import React from 'react';
import {
  Line
} from 'react-chartjs-2';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

class Chart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chart_ready: false, 
      selectedLine: this.props.selectedLine,
      loadedLine: null,
      chartData: null, 
      buttons: [], 
      lineData: null,
      startDate: new Date(Date.now()-86400000),
      dateChanged: false
    };
    this.compare_data.bind(this)
    this.fetchData = this.fetchData.bind(this);
    this.handleLineButtonClick = this.handleLineButtonClick.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this)
  }
  handleDateChange(date){
    console.log(date);
    this.setState({
      startDate: date,
      dateChanged: true,
    });
    this.fetchData();
  }
  shouldComponentUpdate(){
    //this.fetchData();
    return true;
  }
  compare_data(a, b) {
    if (parseInt(a.stop_sequence) > parseInt(b.stop_sequence)) {
      return -1
    } else {
      return 1
    }
  }
  handleLineButtonClick(e, direction){
    let data = this.state.lineData.find(line => line.direction == direction);
    let stops, SWT, AWT, EWT;
    console.log(data);
    data.stops.sort(this.compare_data);
    if(!this.state.direction){
     stops  = data.stops.map(stop => stop.stop_name);
     SWT = data.stops.map(stop => stop.SWT);
     AWT= data.stops.map(stop => stop.AWT);
     EWT = data.stops.map(stop => stop.EWT);
    }
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
      ]}})

  }
  //localhost
  async fetchData() {
    if(this.state.loadedLine !== this.props.selectedLine || this.state.dateChanged){
      try {
        let swt_response;
        
        if(!this.props.selectedLine){
            swt_response = await fetch('http://localhost/ewt');
        }else{
          swt_response = await fetch(`http://localhost/ewt/${this.props.selectedLine}/${new Date(this.state.startDate).getTime()}`);
        }
        
        let line_overview = await swt_response.json();
        let directions = [];
        line_overview.stops.forEach(stop => {
          let direction = directions.find(direction => direction.direction === stop.direction)
          if(!direction){
            directions.push({
              line_id: line_overview.line,
              direction: stop.direction,
              stops: [],
            })
          }else {
            direction.stops.push(stop)
          }
        });
        let buttons_directions = [];
        directions.forEach(direction => {
          buttons_directions.push(direction.direction);
        })
        this.setState({buttons: buttons_directions})
        let stops, SWT, AWT, EWT;
        directions[0].stops.sort(this.compare_data);
        if(!this.state.direction){
         stops  = directions[0].stops.map(stop => stop.stop_name);
         SWT = directions[0].stops.map(stop => stop.SWT);
         AWT= directions[0].stops.map(stop => stop.AWT);
         EWT = directions[0].stops.map(stop => stop.EWT);
        }
  
        
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
          ]}, chart_ready: true, loadedLine: line_overview.line, lineData: directions, dateChanged: false})
     
      } catch (error) {
        console.error(error);
      }
    }
    
  }

  render() {
    this.fetchData();
    let chart;
    let buttons = [];
    if(this.state.buttons.length > 0){
      this.state.buttons.forEach((button, index) => {
        buttons.push(<button type="button" key={index} onClick={e => this.handleLineButtonClick(e, button)} className="btn btn-info">{button}</button>)
      });
    }
    console.log(this.state.buttons);
    if(this.state.chart_ready) {chart = <div width = {500} ><Line data = {this.state.chartData} width = {400} height = {400} options = { {maintainAspectRatio: false }}/>
  </div >}
  else {
    chart =  <div width = {500} style={{textAlign:"center"}}>
          Chart is Loading or no line is selected
      </div >
  }    return (
    <div>
      <div style={{display: "flex", justifyContent:"center", marginTop:"2%"}}>  
        <DatePicker
          selected={this.state.startDate}
          minDate={new Date("29 July, 2019 UTC +02:00")}
          maxDate={new Date(Date.now() - 86400000)}
          onChange={this.handleDateChange}
        />
      </div>
      
          <div style={{textAlign:"center", margin:"2%", fontSize: "1.4em"}}>First pick a line by clicking on an icon above then pick a direction from below</div>
          
         <div style={{display:"flex", flexDirection: "row", justifyContent: "space-evenly", marginTop: "2%", marginBottom: "2%"}}>
         {buttons}
         </div>
         {chart}
    </div>
   

    );
  }
}


export default Chart;
