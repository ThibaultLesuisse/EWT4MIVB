import React, { PureComponent } from 'react'
import Chart from '../../components/chart'
import Text from '../../components/text'

export class Home extends PureComponent {
    render() {
        let style = {
            marginTop: "5%",

        }
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
                    <Chart />
                    <Text />
                </div>
                </div>
                </div>
            </div>
        )
    }
}

export default Home
