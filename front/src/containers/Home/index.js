import React from 'react'
import Chart from '../../components/chart'
import Text from '../../components/text'

export class Home extends React.Component{
    constructor(props){
        super(props);
        this.handleLineClick = this.handleLineClick.bind(this);
        this.state = {
            selectedLine: null,
        }
    }
    handleLineClick(line, e){
        console.log("I was clicked  " + line);
        this.setState({selectedLine: line});

    }
    render() {
        let style = {
            marginTop: "5%",

        }
        const lines = ["39", "95", "1"];
        let _lines = lines.map((line) => 
             <div className={line} key={line} onClick={(e) => this.handleLineClick(line, e)}>{line} </div>
        )
        return (
            <div>
                    <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                        <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="#">EWT For the MIVB</a>
                    </nav>
                <div className="container" style={style}>
                <div className="card">
                    <div className="card-body">
                    <div className="jumbotron">
                    <div className="row justify-content-center">
                    <h1 className="display-4">EWT for the MIVB-STIB</h1>
                    
                    <p className="lead">This project tries to measure the Excess Waiting Time for line 39 of the MIVB</p>
                    </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        {_lines}         
                     </div>
                    <Chart selectedLine={this.state.selectedLine}/>
                   
                    <Text />
                </div>
                </div>
                </div>
            </div>
        )
    }
}

export default Home
