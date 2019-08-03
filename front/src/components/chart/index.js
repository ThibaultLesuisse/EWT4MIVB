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
      dateChanged: true,
      endDate: new Date(Date.now()-86400000)
    };
    
    this.compare_data.bind(this)
    this.fetchData = this.fetchData.bind(this);
    this.handleLineButtonClick = this.handleLineButtonClick.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this)
    this.handleEndDateChange = this.handleEndDateChange.bind(this)
    this.fetchData();
  }
  handleEndDateChange(date){
    this.fetchData();
    this.setState({
      endDate: date,
      dateChanged:true
    })
      }
  handleDateChange(date){
    this.fetchData();
    this.setState({
      startDate: date,
      dateChanged: true,
    });
    
  }
  compare_data(a, b) {
    if (parseInt(a.stop_sequence) > parseInt(b.stop_sequence)) {
      return 1
    } else {
      return -1
    }
  }
  handleLineButtonClick(e, direction){
    let data = this.state.lineData.find(line => line.direction == direction);
    let stops, SWT, AWT, EWT;
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

  async fetchData() {
    console.log(this.props.selectedLine);
    if(this.props.selectedLine !== this.state.loadedLine || this.state.dateChanged){
      try {
        let swt_response;
        if(!this.props.selectedLine){
        }else{
          if(new Date(this.state.startDate).getDate() === new Date(this.state.endDate).getDate()){
            swt_response = await fetch(`http://174.138.107.45/ewt/${this.props.selectedLine}/${new Date(this.state.startDate).getTime()}`);
          }
          else {
            swt_response = await fetch(`http://174.138.107.45/ewt/${this.props.selectedLine}/${new Date(this.state.startDate).getTime()}/${new Date(this.state.endDate).getTime()}`); 
          }
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
          ]}, chart_ready: true, loadedLine: line_overview.line, lineData: directions, dateChanged: false});
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
    if(this.state.chart_ready) {chart = <div width = {500} ><Line data = {this.state.chartData} width = {400} height = {400} options = { {maintainAspectRatio: false }}/>
  </div >}
  else {
    chart =  <div width = {500} style={{textAlign:"center"}}>
          No line is currently selected, click on one of the icons above
      </div >
  }    return (
    <div>
      <form className="form-inline" style={{justifyContent: "center"}}>
      <div style={{display: "flex", justifyContent:"center", marginTop:"2%"}} className="form-group mb-2">  
      <label for="startdate">Start Date:</label> <DatePicker
          selected={this.state.startDate}
          minDate={new Date("31 July, 2019 UTC +02:00")}
          maxDate={new Date(Date.now() - 86400000)}
          onChange={this.handleDateChange}
          id="startdate"
          className="form-control"
        />
        </div>
        <div style={{display: "flex", justifyContent:"center", marginTop:"2%", marginLeft:"2%"}} className="form-group mb-2"> 
        <label for="enddate">End Date:</label> <DatePicker
            selected={this.state.endDate}
            selectsEnd
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            onChange={this.handleEndDateChange}
            minDate={this.state.startDate}
            maxDate={new Date(Date.now() - 86400000)}
            id="enddate"
            className="form-control"
        />
      </div>
      </form>
      
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
