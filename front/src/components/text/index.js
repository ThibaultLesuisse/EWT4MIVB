import React, { Component } from 'react'

class TextComponent extends Component {
    render() {
        return (
            <div style={{margin: "5%"}}>
              
                       <h1 style={{textAlign:"center"}}>Excess Waiting Time applied to the MIVB</h1>
                       <p style={{marginTop: "3%"}}>
                       This project tries to shine a light
                       on the current performance of the MIVB by measuring the Excess Waiting Time. The EWT is the Average Waiting Time - Scheduled Waiting Time or in short EWT = AWT - SWT.
                       <br /></p>

                       <br />
                       <h3 style={{textAlign:"center"}}>Average Waiting Time</h3>
                       <br />
                       <p>
                       The average waiting time is the time that passengers effectively had to wait on average for a tram/bus/metro to arrive at a certain stop.
                       It is assumed that passengers randomly arrive at a stop. It is the exponent of the time between two vehicles at a stop divided by two times the same time. This punishes long waiting times.
                       <br />
                       <br />
                       </p>
                       <h3 style={{textAlign:"center"}}>Scheduled Waiting Time</h3> 
                       <br />
                       <p>
                       The Scheduled Waiting Time is the time that passengers should have to wait on average for a tram/bus/metro to arrive. It is calcuted with the same method as the average waiting time, so the exponent of the time between two vehicles divided by two times the average waiting time.
                       </p>
                       <br />
                       <br />
                       <h3 style={{textAlign:"center"}}>Estimate Waiting Time</h3>
                       Finally once the AWT and the SWT have been measured the SWT can be substracted from the AWT and the result is the Excess Waiting Time. The excess waiting time is the amount of time a passenger has to wait more than scheduled. The closer to 0 the better. It can be negative!
            </div>
        )
    }
}
export default TextComponent;
